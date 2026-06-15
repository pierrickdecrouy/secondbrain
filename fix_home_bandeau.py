import re

with open('src/index.css', 'r') as f:
    css = f.read()

# Add styles for global-header-home to make it float
header_home_css = """
.global-header-home {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: transparent !important;
  border-bottom: none !important;
}

.home-page {
  min-height: 100vh;
  margin-top: -80px; /* Offset the absolute header */
  padding-top: 80px; /* Keep content pushed down */
}
"""

css += '\n' + header_home_css

# Also add the green halo animation requested by user
green_halo_css = """
@keyframes pulse-halo {
  0% { transform: scale(1) translate(-50%, -50%); opacity: 0.15; }
  50% { transform: scale(1.05) translate(-48%, -48%); opacity: 0.25; }
  100% { transform: scale(1) translate(-50%, -50%); opacity: 0.15; }
}

html.dark .home-animated-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60vw;
  height: 60vw;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(10, 15, 24, 0) 70%);
  transform: translate(-50%, -50%);
  animation: pulse-halo 15s ease-in-out infinite;
  opacity: 0.2;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
"""

css += '\n' + green_halo_css

with open('src/index.css', 'w') as f:
    f.write(css)

