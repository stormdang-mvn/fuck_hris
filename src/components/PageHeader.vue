<template>
  <div class="header-section">
    <svg class="header-wave-bottom" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#667eea;stop-opacity:1" />
        </linearGradient>
      </defs>
      <path d="M0,0 L0,40 Q300,120 600,80 T1200,60 L1200,0 Z" :fill="`url(#${gradientId})`"/>
    </svg>
    <div class="header-gradient-overlay"></div>
    <div class="header-bg-decorations">
      <div class="header-logo-bg"></div>
      <div class="header-circle circle-1"></div>
      <div class="header-circle circle-2"></div>
      <div class="header-circle circle-3"></div>
      <div class="header-sparkle sparkle-1">✦</div>
      <div class="header-sparkle sparkle-2">✧</div>
      <div class="header-sparkle sparkle-3">✦</div>
    </div>
    <div class="header-content">
      <slot name="left">
        <!-- Default left content -->
      </slot>
      
      <div class="header-right">
        <img src="@/assets/marubeni-logo.svg" alt="MARUSYS VINA" class="header-logo" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Generate unique gradient ID for each component instance
const gradientId = `waveGradient-${Math.random().toString(36).substr(2, 9)}`
</script>

<style>
/* PageHeader Component Styles */
/* All classes prefixed with .header- to avoid conflicts */
.header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%);
  background-size: 200% 200%;
  animation: gradientShift 15s ease infinite;
  color: white;
  padding: 24px 20px 50px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
  overflow: visible;
}

.header-wave-bottom {
  position: absolute;
  bottom: -60px;
  left: 0;
  width: 100%;
  height: 120px;
  z-index: 1;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
}

.header-gradient-overlay {
  position: absolute;
  bottom: -80px;
  left: 0;
  width: 100%;
  height: 180px;
  background: linear-gradient(
    to bottom,
    rgba(102, 126, 234, 0.35) 0%,
    rgba(118, 75, 162, 0.25) 30%,
    rgba(102, 126, 234, 0.15) 60%,
    rgba(245, 247, 250, 0.5) 85%,
    transparent 100%
  );
  z-index: 0;
  pointer-events: none;
  animation: gradientPulse 8s ease-in-out infinite;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes gradientPulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

/* Header Background Decorations */
.header-bg-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.header-logo-bg {
  position: absolute;
  top: 50%;
  right: 5%;
  transform: translateY(-50%);
  width: 500px;
  height: 500px;
  background-image: url('@/assets/marubeni-logo.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  opacity: 0.12;
  filter: blur(1px);
  animation: logoFloat 8s ease-in-out infinite, logoPulse 4s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(-50%) rotate(0deg);
  }
  50% {
    transform: translateY(-55%) rotate(2deg);
  }
}

@keyframes logoPulse {
  0%, 100% {
    opacity: 0.12;
    filter: blur(1px);
  }
  50% {
    opacity: 0.18;
    filter: blur(0.5px);
  }
}

.header-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  animation: float 6s ease-in-out infinite;
  box-shadow: 0 8px 32px rgba(255, 255, 255, 0.1);
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: -100px;
  right: 10%;
  animation-delay: 0s;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%);
}

.circle-2 {
  width: 150px;
  height: 150px;
  bottom: -75px;
  left: 5%;
  animation-delay: 2s;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.04) 100%);
}

.circle-3 {
  width: 100px;
  height: 100px;
  top: 50%;
  right: 30%;
  animation-delay: 4s;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.03) 100%);
}

.header-sparkle {
  position: absolute;
  color: rgba(255, 255, 255, 0.6);
  font-size: 20px;
  animation: sparkle 3s ease-in-out infinite;
}

.sparkle-1 {
  top: 20%;
  left: 15%;
  animation-delay: 0s;
}

.sparkle-2 {
  top: 70%;
  left: 25%;
  font-size: 16px;
  animation-delay: 1s;
}

.sparkle-3 {
  top: 40%;
  right: 20%;
  font-size: 24px;
  animation-delay: 2s;
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.2) rotate(180deg);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20px) scale(1.1);
    opacity: 0.5;
  }
}

.header-content {
  width: 100%;
  padding: 0 20px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
  position: relative;
  z-index: 2;
  max-width: 1400px;
  margin: 0 auto;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-logo {
  height: 45px;
  width: auto;
  filter: brightness(0) invert(1) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
  opacity: 0.95;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: logoGlow 3s ease-in-out infinite;
}

@keyframes logoGlow {
  0%, 100% {
    filter: brightness(0) invert(1) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
  }
  50% {
    filter: brightness(0) invert(1) drop-shadow(0 6px 20px rgba(255, 255, 255, 0.4));
  }
}

.header-logo:hover {
  opacity: 1;
  transform: scale(1.08) translateY(-2px);
  filter: brightness(0) invert(1) drop-shadow(0 8px 24px rgba(255, 255, 255, 0.5));
}
</style>
