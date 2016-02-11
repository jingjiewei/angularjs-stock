module.exports = function(config) {
    config.set({
        basePath: '../',
        frameworks: [ 'jasmine' ],
        files: [
            'lib/angular/angular.js',
            'lib/angular-mocks/angular-mocks.js',
            'lib/angular/angular-route.js',
            'lib/Chart.min.js',
            'lib/angular-chart.min.js',
            'lib/firebase.js',
            'lib/angularfire.min.js',
            'lib/angular-animate.min.js',
            'js/*.js',
            'test/**/*.js'
        ],
        preprocessors: {
        },
        reporters: [ 'html' ],
        port: 9876,
        colors: true,
        autoWatch: true,
        browsers: [ 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'],
        captureTimeout: 60000,
        //
        //// you can define custom flags
        //customLaunchers: {
        //    Chrome_without_security: {
        //        base: 'Chrome',
        //        flags: ['--disable-web-security']
        //    }
        //},
        browserNoActivityTimeout: 30000,
        singleRun: false,
        plugins: [
            'karma-chrome-launcher ',
            'karma-jasmine',
            'karma-jasmine-html-reporter'
        ]
    });
};
