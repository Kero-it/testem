var fs = require('fs')
var path = require('path')
var browserstack = require('../cloud_browsers/browserstack')
var screen = require('../ui/screen')
var functions = require('./functions')
var log = require('winston')
var setRawMode = process.stdin.setRawMode ? 
    function(bool){ process.stdin.setRawMode(bool) } :
    require('tty').setRawMode

var userHomeDir = process.env.HOME || process.env.USERPROFILE

function App(config){

    var app = null

    function newApp(launchers){
        return {
            selection: 0,
            checked: [],
            launchers: launchers
        }
    }

    initialize()
    function initialize(){

        configBrowserStack()
        function configBrowserStack(){
            var filepath = path.join(userHomeDir, '.browserstack.json')
            var config = JSON.parse(fs.readFileSync(filepath) + '')
            var bs = browserstack(config)
            bs.getBrowsers(function(err, browsers){
                app = newApp([
                    {section: 'BrowserStack Mobile Browsers', launchers: browsers.mobile},
                    {section: 'BrowserStack Desktop Browsers', launchers: browsers.desktop}
                ])
                renderApp()
            })
        }

        initScreen()
        function initScreen(){
            screen.reset()
            screen.erase('screen')
            screen.cursor(false)
            screen.on('data', onInputChar)
            screen.on('^C', quit)
        }
    }

    function renderApp(){
        var lineIdx = 1
        function writeLine(str){
            screen.position(1, lineIdx++)
            screen.write(str)
        }
        var lines = functions.render(app)
        lines.forEach(writeLine)
    }

    function onInputChar(buf){
        var chr = String(buf).charAt(0)
        if (chr === 'q') quit()
        app = functions.step(app, buf)
        renderApp()
    }
    
    function quit(){
        cleanUp()
        process.exit()
    }

    function cleanUp(){
        screen.display('reset')
        screen.erase('screen')
        screen.position(0, 0)
        screen.enableScroll()
        screen.cursor(true)
        setRawMode(false)
        screen.destroy()
    }

}

module.exports = App