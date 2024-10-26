// tailwind.config.js
module.exports = {
    content: [
      "./views/**/*.ejs",       // Scans all EJS files in the views directory
      "./public/css/**/*.css"    // Scans custom CSS files in the public/css directory
    ],
    theme: {
      extend: {
        colors: {
          iosGray: '#f2f2f7',   // Custom iOS-inspired gray
          iosBlue: '#007aff',   // Custom iOS-inspired blue
          iosDark: '#1c1c1e',   // Custom iOS-inspired dark color
          iosLight: '#ffffff',  // Custom iOS-inspired light color
        },
        fontFamily: {
          sans: [
            '-apple-system', 
            'BlinkMacSystemFont', 
            'Segoe UI', 
            'Roboto', 
            'Helvetica Neue', 
            'Arial', 
            'sans-serif'
          ]
        }
      }
    },
    plugins: [],
  };
  