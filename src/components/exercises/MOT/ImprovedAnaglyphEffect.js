import * as THREE from 'three';

// Improved AnaglyphEffect implementation to avoid recursion issues and improve visibility
export class ImprovedAnaglyphEffect {
  constructor(renderer, width = 512, height = 512, disparity = 0.064) {
    // Modified red-cyan matrices that preserve brightness
    // Left eye (red) - keeps full red channel and some green/blue for brightness
    this.colorMatrixLeft = new THREE.Matrix3().fromArray([
      1.0, 0.0, 0.0,
      0.0, 0.2, 0.0,
      0.0, 0.0, 0.2
    ]);

    // Right eye (cyan) - keeps full green/blue channels and some red for brightness
    this.colorMatrixRight = new THREE.Matrix3().fromArray([
      0.2, 0.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 0.0, 1.0
    ]);

    // Create stereo camera with configurable eye separation
    this.stereoCamera = new THREE.StereoCamera();
    this.stereoCamera.eyeSep = disparity; // Configurable eye separation
    this.disparity = disparity;

    // Set up render targets with higher quality settings
    const renderTargetParams = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter, // Better quality filtering
      format: THREE.RGBAFormat,
      encoding: THREE.sRGBEncoding, // Use sRGB encoding for better color reproduction
      type: THREE.HalfFloatType // Use half-float for better precision
    };

    this.renderTargetL = new THREE.WebGLRenderTarget(width, height, renderTargetParams);
    this.renderTargetR = new THREE.WebGLRenderTarget(width, height, renderTargetParams);

    // Create shader material for anaglyph effect with enhanced brightness and contrast
    this.anaglyphMaterial = new THREE.ShaderMaterial({
      uniforms: {
        mapLeft: { value: this.renderTargetL.texture },
        mapRight: { value: this.renderTargetR.texture },
        colorMatrixLeft: { value: this.colorMatrixLeft },
        colorMatrixRight: { value: this.colorMatrixRight },
        brightness: { value: 1.0 }, // Normal brightness
        contrast: { value: 1.0 }    // Normal contrast
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D mapLeft;',
        'uniform sampler2D mapRight;',
        'varying vec2 vUv;',
        'uniform mat3 colorMatrixLeft;',
        'uniform mat3 colorMatrixRight;',
        'uniform float brightness;',
        'uniform float contrast;',
        'void main() {',
        '  vec4 colorL = texture2D(mapLeft, vUv);',
        '  vec4 colorR = texture2D(mapRight, vUv);',
        '  // Calculate original luminance to preserve brightness',
        '  float lumL = dot(colorL.rgb, vec3(0.299, 0.587, 0.114));',
        '  float lumR = dot(colorR.rgb, vec3(0.299, 0.587, 0.114));',
        '  float originalLum = max(lumL, lumR);',
        '  // Apply color matrices with improved blending',
        '  vec3 color = clamp(',
        '    colorMatrixLeft * colorL.rgb +',
        '    colorMatrixRight * colorR.rgb, 0., 1.);',
        '  // Calculate new luminance',
        '  float newLum = dot(color, vec3(0.299, 0.587, 0.114));',
        '  // Preserve original brightness by scaling if needed',
        '  float lumRatio = newLum > 0.01 ? originalLum / newLum : 1.0;',
        '  color = color * mix(1.0, lumRatio, 0.7);', // Blend between anaglyph and original brightness
        '  // Apply brightness and contrast adjustments',
        '  color = (color - 0.5) * contrast + 0.5;', // Contrast
        '  color = color * brightness;',              // Brightness
        '  color = clamp(color, 0.0, 1.0);',          // Clamp values',
        '  // Preserve original alpha for proper transparency',
        '  gl_FragColor = vec4(',
        '    color.r, color.g, color.b,',
        '    max(colorL.a, colorR.a));',
        '}'
      ].join('\n')
    });

    // Create a simple scene with a quad for rendering the anaglyph effect
    this.anaglyphScene = new THREE.Scene();
    this.anaglyphQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.anaglyphMaterial);
    this.anaglyphScene.add(this.anaglyphQuad);
    this.anaglyphCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Original renderer reference for direct calls
    this.renderer = renderer;
    this.originalRender = renderer.render.bind(renderer);

    // Update render target sizes
    this.setSize = function(width, height) {
      const pixelRatio = renderer.getPixelRatio();
      this.renderTargetL.setSize(width * pixelRatio, height * pixelRatio);
      this.renderTargetR.setSize(width * pixelRatio, height * pixelRatio);
    };

    // Set initial size
    this.setSize(width, height);
  }

  // Method to update the disparity (eye separation)
  setDisparity(disparity) {
    this.disparity = disparity;
    this.stereoCamera.eyeSep = disparity;
  }

  render(scene, camera) {
    // Store current renderer state
    const currentRenderTarget = this.renderer.getRenderTarget();
    const currentXrEnabled = this.renderer.xr.enabled;
    
    // Temporarily disable XR if active
    this.renderer.xr.enabled = false;

    // Update world matrices if needed
    if (scene.matrixWorldAutoUpdate === true) scene.updateMatrixWorld();
    if (camera.parent === null && camera.matrixWorldAutoUpdate === true) camera.updateMatrixWorld();

    // Update stereo camera based on main camera
    this.stereoCamera.update(camera);

    // Preserve the original camera's aspect ratio and FOV
    if (camera.isPerspectiveCamera) {
      this.stereoCamera.cameraL.fov = camera.fov;
      this.stereoCamera.cameraR.fov = camera.fov;
      this.stereoCamera.cameraL.aspect = camera.aspect;
      this.stereoCamera.cameraR.aspect = camera.aspect;
      this.stereoCamera.cameraL.updateProjectionMatrix();
      this.stereoCamera.cameraR.updateProjectionMatrix();
    }

    // Render left eye
    this.renderer.setRenderTarget(this.renderTargetL);
    this.renderer.clear();
    this.originalRender(scene, this.stereoCamera.cameraL);

    // Render right eye
    this.renderer.setRenderTarget(this.renderTargetR);
    this.renderer.clear();
    this.originalRender(scene, this.stereoCamera.cameraR);

    // Render anaglyph effect to the screen
    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    this.originalRender(this.anaglyphScene, this.anaglyphCamera);

    // Restore renderer state
    this.renderer.setRenderTarget(currentRenderTarget);
    this.renderer.xr.enabled = currentXrEnabled;
  }

  dispose() {
    // Clean up resources
    this.renderTargetL.dispose();
    this.renderTargetR.dispose();
    this.anaglyphMaterial.dispose();
    this.anaglyphQuad.geometry.dispose();
  }
}