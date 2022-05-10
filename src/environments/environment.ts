// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  hostname: 'localhost:4201',
  nodeHostname: 'node.deso.org',  // TODO deleteme
  walletSyncHostname: 'localhost:8091',
  hubHostnames: [
    'spv11.lbry.com:50001',
    'spv12.lbry.com:50001',
    'spv13.lbry.com:50001',
    'spv14.lbry.com:50001',
    'spv15.lbry.com:50001',
    'spv16.lbry.com:50001',
    'spv17.lbry.com:50001',
    'spv18.lbry.com:50001',
    'spv19.lbry.com:50001',
  ]
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
