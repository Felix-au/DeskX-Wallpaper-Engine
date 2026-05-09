module.exports = {
  packagerConfig: {
    name: 'Wallpaper Engine',
    executableName: 'WallpaperEngine',
    icon: './assets/icon',
    // Use asar but unpack native modules so they load correctly
    asar: {
      unpack: '**/{koffi,node_modules/koffi}/**',
    },
    // Windows-specific metadata
    win32metadata: {
      CompanyName: 'Wallpaper Engine',
      ProductName: 'Wallpaper Engine',
      FileDescription: 'Desktop Wallpaper Manager',
      OriginalFilename: 'WallpaperEngine.exe',
    },
    // Don't include dev files in the package
    ignore: [
      /^\/\.git/,
      /^\/\.gitignore/,
      /^\/generate-icon\.js/,
      /^\/implementation_plan\.md/,
      /^\/\.gemini/,
    ],
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'WallpaperEngine',
        setupExe: 'WallpaperEngine-Setup.exe',
        setupIcon: './assets/icon.ico',
        noMsi: true,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
  ],
};
