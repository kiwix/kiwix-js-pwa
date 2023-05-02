const config = {

  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "ie": "11",
          "edge": "17",
          "firefox": "60",
          "chrome": "67",
          "safari": "11.1"
        },
        "modules": false,
        "spec": true,
        "useBuiltIns": "usage",
        // "forceAllTransforms": true,
        "corejs": "3.30.1"
      }
    ]
  ],
  // "plugins": [
  //     [ "polyfill-corejs3", 
  //         {
  //             "method": "usage-global",
  //             "version": "3.20",
  //             // "exclude": [ ]
  //         }
  //     ]
  // ],
  "exclude": [ "node_modules/**" ]

};

export default config;