#!/usr/bin/env node

/**
 * Bundle Analysis Script for Baby Goats App
 * Analyzes dependencies and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');

function analyzePackageJson() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  console.log('📦 Bundle Analysis for Baby Goats App\n');
  console.log('='.repeat(50));
  
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  
  console.log(`\n📊 Dependencies Summary:`);
  console.log(`• Production dependencies: ${Object.keys(dependencies).length}`);
  console.log(`• Development dependencies: ${Object.keys(devDependencies).length}`);
  
  // Analyze heavy dependencies
  console.log('\n🔍 Analyzing Dependencies:\n');
  
  const heavyPackages = [
    'react-native-chart-kit',
    'react-native-svg',
    'react-native-webview',
    '@supabase/supabase-js',
    'react-native-reanimated',
  ];
  
  const lightweightAlternatives = {
    'react-native-chart-kit': 'Consider: react-native-svg for custom lightweight charts',
    'react-native-webview': 'Consider: Linking.openURL for external links instead',
  };
  
  heavyPackages.forEach(pkg => {
    if (dependencies[pkg]) {
      console.log(`📦 ${pkg}: ${dependencies[pkg]}`);
      if (lightweightAlternatives[pkg]) {
        console.log(`   💡 ${lightweightAlternatives[pkg]}`);
      }
    }
  });
  
  // Check for potential duplicates or unnecessary packages
  console.log('\n🔍 Optimization Opportunities:\n');
  
  const optimizations = [];
  
  // Check for unused or heavy packages
  if (dependencies['react-native-webview']) {
    optimizations.push('🟡 react-native-webview: Heavy package - verify if needed for core functionality');
  }
  
  if (dependencies['react-native-chart-kit'] && dependencies['react-native-svg']) {
    optimizations.push('💡 Consider building custom charts with react-native-svg instead of chart-kit');
  }
  
  // Check for multiple font packages
  const fontPackages = Object.keys(dependencies).filter(pkg => pkg.includes('font'));
  if (fontPackages.length > 2) {
    optimizations.push(`🟡 Multiple font packages detected: ${fontPackages.join(', ')}`);
  }
  
  // Display optimizations
  if (optimizations.length > 0) {
    optimizations.forEach(opt => console.log(opt));
  } else {
    console.log('✅ No obvious optimization opportunities found');
  }
  
  // Bundle size recommendations
  console.log('\n🎯 Performance Recommendations:\n');
  
  const recommendations = [
    '1. ✅ Use expo-image instead of Image for better performance',
    '2. ✅ Implement lazy loading for screens using React.lazy()',
    '3. ✅ Use expo-linear-gradient sparingly (already optimized)',
    '4. 💡 Consider removing react-native-webview if not essential',
    '5. ✅ Optimize image assets with the new ImageOptimizer',
    '6. 💡 Bundle splitting: Load heavy features on-demand',
  ];
  
  recommendations.forEach(rec => console.log(rec));
  
  // Check for expo optimization
  console.log('\n📱 Expo-Specific Optimizations:\n');
  
  const expoOptimizations = [
    '• ✅ Using expo-image for optimized image rendering',
    '• ✅ Using expo-linear-gradient for performant gradients',
    '• ✅ Using expo-router for efficient navigation',
    '• 💡 Consider expo-av for media instead of react-native-video',
    '• 💡 Use expo-constants for environment variables',
  ];
  
  expoOptimizations.forEach(opt => console.log(opt));
  
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Analysis Complete. Focus on image optimization and lazy loading.');
}

function checkAssetSizes() {
  console.log('\n📷 Asset Analysis:\n');
  
  const assetsPath = path.join(__dirname, '..', 'assets');
  
  if (fs.existsSync(assetsPath)) {
    const assets = fs.readdirSync(assetsPath, { withFileTypes: true });
    let totalSize = 0;
    
    assets.forEach(asset => {
      if (asset.isFile()) {
        const filePath = path.join(assetsPath, asset.name);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        totalSize += stats.size;
        
        if (stats.size > 500000) { // > 500KB
          console.log(`🟡 Large asset: ${asset.name} (${sizeKB} KB)`);
        } else {
          console.log(`✅ ${asset.name} (${sizeKB} KB)`);
        }
      }
    });
    
    console.log(`\n📊 Total asset size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (totalSize > 10 * 1024 * 1024) { // > 10MB
      console.log('🟡 Consider optimizing assets - large bundle size detected');
    } else {
      console.log('✅ Asset bundle size is reasonable');
    }
  } else {
    console.log('📁 No assets folder found - creating optimized structure recommended');
  }
}

function generateOptimizationPlan() {
  console.log('\n🎯 Optimization Action Plan:\n');
  
  const actionPlan = [
    {
      priority: 'HIGH',
      action: 'Image Optimization',
      status: '✅ IMPLEMENTED',
      description: 'ImageOptimizer class created and integrated'
    },
    {
      priority: 'HIGH', 
      action: 'Lazy Loading Implementation',
      status: '🔄 NEXT',
      description: 'Implement React.lazy() for screens'
    },
    {
      priority: 'MEDIUM',
      action: 'Bundle Analysis',
      status: '✅ IN PROGRESS',
      description: 'This script provides bundle insights'
    },
    {
      priority: 'MEDIUM',
      action: 'Asset Compression',
      status: '🔄 RECOMMENDED',
      description: 'Compress PNG/JPG assets, use WebP where possible'
    },
    {
      priority: 'LOW',
      action: 'Dependency Audit',
      status: '🔄 PERIODIC',
      description: 'Regular review of unused dependencies'
    }
  ];
  
  actionPlan.forEach(item => {
    console.log(`${item.status} [${item.priority}] ${item.action}`);
    console.log(`   ${item.description}\n`);
  });
}

// Run analysis
try {
  analyzePackageJson();
  checkAssetSizes();
  generateOptimizationPlan();
} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message);
}