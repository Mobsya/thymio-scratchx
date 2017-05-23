# thymio-scratchx
A ScratchX extension for Thymio II Wireless Robot. (www.thymio.org) 
How to use the attached ScratchX extension for Thymio:

1   Your browsers need to allow the origin from a local file since there is a need to modify the httpaseba bridge. Until done the first thing to do is to enable your browser by adding a PLUGIN called "Allow-control-origin".

On your browser on google type "allow-control-origin chrome plugin" (you need to change chrome with firefox if you use firefox or any other browser name). Look for the plug in and install it. It is simple. You get an icon with the plugin in your browser as a result of that.

IN THE PRODUCTION SYSTEM this needs to be solved by modifying the Asebahttp bridge. 

2   Connect a (Wireless) Thymio robot to your computer

Go here: https://github.com/davidjsherman/inirobot-scratch-thymioII/releases/tag/0.7.4-alpha

and download the zip file: Scratch2-ThymioII-0.7.4b-... (following your OS)

Unzip the file, go in the folder and launch the shortcut "Scratch2-ThymioII"

It will start an Asebahttp bridge (the David Sherman plugin) and connect to the robot connected to your computer. On Windows, you get a message.

3   Go to http://scratchx.org/#scratch

and in the middle there is the button "Load Experimental Extension".

RIGHT CLICK on it, or CTRL + SHIFT + CLICK on it, then you will get a file browser: 
(a left click will look for a .sbx file or a URL, that's not what we want)

Use the  
thymio_extension_20170505.js
33.6 KB 
and open it.

You will get a message and see that new blocks appeared behind, just click OK

If the dot is green, Thymio is connected, you can program with Scratch

If not, try to restart the shortcut "Scratch2-ThymioII" from the zip of David's github release repository.


THIS IS NOT the FINAL version. It is the test version. 
