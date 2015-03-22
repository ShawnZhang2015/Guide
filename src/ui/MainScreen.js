/**
 * Created by zxh on 15/3/17.
 */

MainScreen = cc.Layer.extend({

    ctor: function() {
        this._super();
        sz.uiloader.widgetFromJsonFile(this, 'res/MainScreen.json');
        this._fire1.setContentSize(50,50);
        this._fire2.setContentSize(50,50);
    },

    /**
     * 显示提示
     * @param string
     * @private
     */
    _showHint: function(string) {
        var label = new cc.LabelTTF(string, "宋体", "48");
        label.setPosition(this.width * 0.5, this.height * 0.5);
        label.setColor(cc.color.RED);
        this.addChild(label, 1000);
        var fadeIn = cc.fadeIn(0.3);
        var delay = cc.delayTime(0.2);
        var fadeOut = cc.fadeOut(0.5);
        var moveBy = cc.moveBy(0.5, cc.p(0, 300));
        var sequence = cc.sequence(fadeIn, delay);
        var spawn = cc.spawn(fadeOut, moveBy);
        var action = cc.sequence(sequence, spawn, cc.callFunc(function() {label.removeFromParent()}));
        label.runAction(action);
    },

    onEnter: function() {
        this._super();
        this.scheduleOnce(function() {
            new sz.GuideLayer(this, guideConfig);
        }, 1);
    },

    _onBtnHomeTouchEnded: function() {
        this._showHint('_onBtnHomeTouchEnded');
    },

    _onFire1TouchBegan: function(sender) {
        sender.visible = !sender.visible;
        this._showHint('_onFire1TouchBegan');
    },

    _onFire2TouchBegan: function(sender) {
        sender.visible = !sender.visible;
        this._showHint('_onFire2TouchBegan');
    }

});

sz.UILoader.prototype._onWidgetEvent = function(sender, type) {
    if (type === ccui.Widget.TOUCH_ENDED) {
        cc.log('onWidgetEvent:' + sender.getName());
    }
};