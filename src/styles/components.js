import styled, { css, keyframes } from 'styled-components';

const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
`;

const slideIn = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export const Card = styled.div`
  background: ${props => props.glass ? props.theme.glass.background : props.theme.colors.background.paper};
  backdrop-filter: ${props => props.glass ? props.theme.glass.blur : 'none'};
  -webkit-backdrop-filter: ${props => props.glass ? props.theme.glass.blur : 'none'};
  border: ${props => props.glass ? props.theme.glass.border : 'none'};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.glass ? props.theme.glass.shadow : props.theme.shadows.lg};
  padding: ${props => props.theme.spacing(6)};
  transition: ${props => props.theme.transitions.default};
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.xl};
  }

  animation: ${slideIn} 0.3s ease-out;
`;

export const Button = styled.button`
  position: relative;
  padding: ${props => props.theme.spacing(3)} ${props => props.theme.spacing(6)};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-weight: 600;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing(2)};
  
  ${props => {
    const variant = props.variant || 'primary';
    const color = props.theme.colors[variant] || props.theme.colors.primary;
    
    if (props.glass) {
      return css`
        background: ${props.theme.glass.background};
        backdrop-filter: ${props.theme.glass.blur};
        -webkit-backdrop-filter: ${props.theme.glass.blur};
        border: ${props.theme.glass.border};
        color: ${props.theme.colors.text.primary};
        
        &:hover {
          background: rgba(255, 255, 255, 0.9);
        }
      `;
    }
    
    return css`
      background: ${color.gradient};
      color: white;
      
      &:hover {
        background: ${color.hover};
        transform: translateY(-2px);
      }
      
      &:active {
        background: ${color.active};
        transform: translateY(0);
      }
    `;
  }}

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  
  &:active::after {
    animation: ${ripple} 0.6s linear;
  }

  &:disabled {
    background: ${props => props.theme.colors.grey[300]};
    cursor: not-allowed;
    transform: none;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing(3)};
  background: ${props => props.glass ? 'rgba(255, 255, 255, 0.1)' : props.theme.colors.background.paper};
  border: 2px solid ${props => props.theme.colors.grey[200]};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-family: inherit;
  font-size: 1rem;
  transition: ${props => props.theme.transitions.default};
  
  &:focus {
    border-color: ${props => props.theme.colors.primary.main};
    box-shadow: 0 0 0 4px ${props => props.theme.colors.primary.light}20;
    outline: none;
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.grey[400]};
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: ${props => props.theme.spacing(3)};
  background: ${props => props.glass ? 'rgba(255, 255, 255, 0.1)' : props.theme.colors.background.paper};
  border: 2px solid ${props => props.theme.colors.grey[200]};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-family: inherit;
  font-size: 1rem;
  transition: ${props => props.theme.transitions.default};
  cursor: pointer;
  
  &:focus {
    border-color: ${props => props.theme.colors.primary.main};
    box-shadow: 0 0 0 4px ${props => props.theme.colors.primary.light}20;
    outline: none;
  }
`;

export const Checkbox = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing(3)};
  cursor: pointer;
  user-select: none;
  padding: ${props => props.theme.spacing(2)} 0;
  transition: ${props => props.theme.transitions.default};

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .checkmark {
    position: relative;
    height: 24px;
    width: 24px;
    background: ${props => props.glass ? 'rgba(255, 255, 255, 0.1)' : props.theme.colors.background.paper};
    border: 2px solid ${props => props.theme.colors.grey[300]};
    border-radius: ${props => props.theme.borderRadius.md};
    transition: ${props => props.theme.transitions.default};
  }

  &:hover .checkmark {
    border-color: ${props => props.theme.colors.primary.main};
    transform: scale(1.05);
  }

  input:checked ~ .checkmark {
    background: ${props => props.theme.colors.primary.gradient};
    border-color: transparent;
  }

  .checkmark:after {
    content: "";
    position: absolute;
    display: none;
    left: 8px;
    top: 4px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  input:checked ~ .checkmark:after {
    display: block;
  }
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${props => props.theme.spacing(1)} ${props => props.theme.spacing(3)};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.875rem;
  font-weight: 600;
  
  ${props => {
    const variant = props.variant || 'primary';
    const color = props.theme.colors[variant] || props.theme.colors.primary;
    
    if (props.glass) {
      return css`
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.18);
        color: ${props.theme.colors.text.primary};
      `;
    }
    
    return css`
      background: ${color.light}15;
      color: ${color.dark};
    `;
  }}
`;

export const Tooltip = styled.div`
  position: relative;
  display: inline-block;

  .tooltip-text {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(8px);
    padding: ${props => props.theme.spacing(2)} ${props => props.theme.spacing(3)};
    background: ${props => props.glass ? props.theme.glass.background : props.theme.colors.grey[800]};
    backdrop-filter: ${props => props.glass ? props.theme.glass.blur : 'none'};
    color: ${props => props.glass ? props.theme.colors.text.primary : 'white'};
    border-radius: ${props => props.theme.borderRadius.lg};
    font-size: 0.875rem;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: ${props => props.theme.transitions.default};
    z-index: ${props => props.theme.zIndex.tooltip};
    box-shadow: ${props => props.theme.shadows.lg};

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-width: 6px;
      border-style: solid;
      border-color: ${props => props.glass ? 'rgba(255, 255, 255, 0.8)' : props.theme.colors.grey[800]} transparent transparent transparent;
    }
  }

  &:hover .tooltip-text {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
  }
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.glass ? 'rgba(255, 255, 255, 0.1)' : props.theme.colors.grey[200]};
  border-radius: ${props => props.theme.borderRadius.full};
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: ${props => props.value}%;
    height: 100%;
    background: ${props => props.theme.colors.primary.gradient};
    border-radius: ${props => props.theme.borderRadius.full};
    transition: width 0.3s ease-in-out;
  }
`;

export const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${props => props.theme.colors.grey[200]};
  border-top-color: ${props => props.theme.colors.primary.main};
  border-radius: 50%;
  animation: ${rotate} 1s linear infinite;
`;

export const Grid = styled.div`
  display: grid;
  gap: ${props => props.theme.spacing(props.gap || 4)};
  grid-template-columns: repeat(${props => props.columns || 'auto-fit'}, minmax(${props => props.minWidth || '250px'}, 1fr));
`;

export const Flex = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing(props.gap || 4)};
  align-items: ${props => props.alignItems || 'center'};
  justify-content: ${props => props.justifyContent || 'flex-start'};
  flex-direction: ${props => props.direction || 'row'};
  flex-wrap: ${props => props.wrap || 'nowrap'};
`;

export const Container = styled.div`
  max-width: ${props => props.maxWidth || '1200px'};
  margin: 0 auto;
  padding: ${props => props.theme.spacing(4)};
  width: 100%;
`;

export const Divider = styled.hr`
  border: none;
  height: 1px;
  background: ${props => props.theme.colors.grey[200]};
  margin: ${props => props.theme.spacing(4)} 0;
`;