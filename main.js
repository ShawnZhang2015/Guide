
cc.game.onStart = function(){

    cc.view.adjustViewPort(true);
    cc.view.setDesignResolutionSize(640, 960,cc.ResolutionPolicy.SHOW_ALL);
    cc.view.resizeWithBrowserSize(true);
    cc.LoaderScene.preload([].concat(G_JSON, G_ALTARSCENE, G_COMMON, G_DEFAULT, G_MAINMENU), function () {
        var scene = new cc.Scene();
        scene.addChild(new MainScreen());
        cc.director.runScene(scene);
    }, this);


    var textarea = document.getElementById('text');
    textarea.value = JSON.stringify(guideConfig, null, 4);

};
cc.game.run();