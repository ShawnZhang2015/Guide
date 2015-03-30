/**
 * Created by zxh on 15/3/20.
 */
/**
 * Created by zxh on 15/3/18.
 */

var guideConfig = {
    tasks: {
        1: [
            {
                log: "关闭第一盏灯",
                command: sz.GuideCommand.GC_FINGER_HINT,
                locator:"_fire1",

                onEnter: function(cb) {
                    var label = new cc.LabelTTF("关闭第一盏灯", "宋体", 48);
                    var pt = cc.p(this.width / 2, this.height / 2);
                    label.setPosition(pt);
                    this.addChild(label);

                    var faceOut = cc.fadeOut(3);
                    var call = cc.callFunc(function() {
                        label.removeFromParent();
                        cb();
                    }, this);
                    label.runAction(cc.sequence(faceOut, call))
                },

                //onLocateNode: function(node) {
                //    var point = node.getParent().convertToWorldSpace(node.getPosition());
                //    point.x += node.width / 2;
                //    point.y += node.height / 2;
                //    this._fingerToPoint(point, true);
                //}

                onLocateNode: function(node) {
                    this._touchRect.x -= node.width / 2;
                    this._touchRect.y -= node.height / 2;
                    var point = cc.p(this._touchRect.x + node.width / 2, this._touchRect.y + node.height / 2);
                    this.showMask();
                    this._fingerToPoint(point, true);
                }
            },

            {
                log: "关闭第二盏灯",
                command: sz.GuideCommand.GC_FINGER_HINT,
                locator:"_fire2"
            },

            {
                log: "保存进度",
                command: sz.GuideCommand.GC_SAVE_PROGRESS
            },

            {
                log: "点亮第一盏灯",
                command: sz.GuideCommand.GC_FINGER_HINT,
                locator:"_fire1",
                showMask: true
            },

            {
                log: "点亮第二盏灯",
                command: sz.GuideCommand.GC_FINGER_HINT,
                locator:"_fire2",
                showMask: true
            },
        ],

        2: [
            {
                log:'点击home',
                command: sz.GuideCommand.GC_FINGER_HINT,
                locator:"_btnHome",
                eventType:0
            }
        ],

        3: [
            {
                log:'点击task',
                command: sz.GuideCommand.GC_FINGER_HINT,
                locator:"_btnTask",
                showMask: true
            }
        ]
    },
    locateNodeDurationTime: 0.1,
    fingerImage: 'res/finger.png',
    eventType: 2,
    isShowMask: true  //默认为不打开
};
