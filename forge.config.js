module.exports = {
  packagerConfig: {
    name: 'DeskX',
    executableName: 'DeskX',
    icon: './assets/DeskXLogo',
    // Use asar but unpack native modules so they load correctly
    asar: {
      unpack: '**/{koffi,node_modules/koffi}/**',
    },
    // Windows-specific metadata
    win32metadata: {
      CompanyName: 'DeskX',
      ProductName: 'DeskX Wallpaper Engine',
      FileDescription: 'Desktop Wallpaper Manager',
      OriginalFilename: 'DeskX.exe',
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
        name: 'DeskX',
        setupExe: 'DeskX-Setup.exe',
        setupIcon: './assets/DeskXLogo.ico',
        noMsi: true,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
  ],
};
