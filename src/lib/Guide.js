/**
 * Created by zxh on 15/3/17.
 */
var sz = sz || {};


sz.Locator = {

    /**
     * 定位解析
     * @param locator
     * @returns {Array}
     */
    parse: function(locator) {
        cc.assert(locator, 'locator string is null');

        //使用正则表达示分隔名字
        var names = locator.split(/[.,//,>,#]/g);
        var segments = names.map(function(name) {
            var index = locator.indexOf(name);
            var symbol = locator[index - 1] || '>';
            return {symbol: symbol, name: name.trim()};
        });
        return segments;
    },

    /**
     * 通过节点名搜索节点对象
     * @param root
     * @param name
     * @returns {*}
     */
    seekNodeByName: function(root, name) {
        if (!root)
            return null;
        if (root.getName() == name)
            return root;
        var arrayRootChildren = root.getChildren();
        var length = arrayRootChildren.length;
        for (var i = 0; i < length; i++) {
            var child = arrayRootChildren[i];
            var res = this.seekNodeByName(child, name);
            if (res != null)
                return res;
        }
        return null;
    },

    /**
     * 通过Tag搜索节点
     * @param root
     * @param tag
     * @returns {*}
     */
    seekNodeByTag: function (root, tag) {
        if (!root)
            return null;
        if (root.getTag() == tag)
            return root;
        var arrayRootChildren = root.getChildren();
        var length = arrayRootChildren.length;
        for (var i = 0; i < length; i++) {
            var child = arrayRootChildren[i];
            var res = this.seekNodeByTag(child, tag);
            if (res != null)
                return res;
        }
        return null;
    },

    /**
     * 在root节点中，定位locator
     * @param root
     * @param locator
     * @param cb
     */
    locateNode: function(root, locator, cb) {
        var segments = this.parse(locator);
        cc.assert(segments && segments.length);
        cc.log('guide locateNode:' + locator);
        var child, node = root;

        for (var i = 0; i < segments.length; i++) {
            var item = segments[i];
            switch (item.symbol) {
                case '/': child = node.getChildByName(item.name); break;
                case '.': child = node[item.name]; break;
                case '>': child = this.seekNodeByName(node, item.name); break;
                case '#': child = this.seekNodeByTag(node, item.name); break;
            }

            if (!child) {
                node = null;
                break;
            }
            node = child;
        }

        if (node) {
            cb(node);
        }
        return node;
    }
};

//引导指令
sz.GuideCommand = {
    GC_NULL: undefined, //空指令
    GC_SET_PROPERTY: 1, //设置属性
    GC_FINGER_HINT: 2,  //手型提示
    GC_SAVE_PROGRESS: 3 //保存进度
};

sz.GuideIndexName = 'sz.guideIndexName';

sz.GuideTaskHandle = cc.Class.extend({
    _guideLayer:  null,
    _guideConfig: null,
    _curStepConfig: null,
    ctor: function(guideLayer, guidConfig) {
        this._guideLayer = guideLayer;
        this._guideConfig = guidConfig;
        this._processTasks();
    },

    /**
     * 初始化任务队列与步骤id, 实际使用时，请重写此函数
     * @private
     */
    _initTasks: function() {
        //分析任务
        var tasks = [];
        for (var key in this._guideConfig.tasks) {
            if (this._guideConfig.tasks.hasOwnProperty(key)) {
                tasks.push(this._guideConfig.tasks[key]);
            }
        }
        tasks.splice(0, this._guideLayer._index);
        return tasks;
    },

    _processTasks: function() {
        var self = this;
        //加载进度
        this._guideLayer.loadProgress();
        //初始化任务队列
        var tasks = this._initTasks();

        //一个step
        var stepHandle = function(step, callback) {
            self._curStepConfig = step;
            async.series({
                //步骤开始
                stepBegin: function(cb) {
                    self._guideLayer._setLocateNode(null);
                    if (step.onEnter) {
                        step.onEnter.call(self._guideLayer, cb);
                    } else {
                        cb();
                    }
                },

                //步骤处理
                stepProcess: function(cb) {
                    if (step.delayTime) {
                        self._guideLayer.scheduleOnce(function() {
                            self._processStep(step, cb);
                        }, step.delayTime);
                    } else {
                        self._processStep(step, cb);
                    }
                },

                //步骤完毕
                stepEnd: function() {
                    if (step.onExit) {
                        step.onExit.call(self._guideLayer, callback);
                    } else {
                        callback();
                    }
                }
            });
        };

        //任务组
        async.eachSeries(tasks, function(task, cb) {
            async.eachSeries(task, stepHandle, function() {
                self._guideLayer.saveProgress(true, cb);
            });
        }, function() {
            self._exitGuide();
        });
    },

    getCurStepConfig: function() {
        return this._curStepConfig;
    },

    _exitGuide: function() {
        this._guideLayer.destory();
        this._guideLayer = null;
    },

    /**
     *
     */
    _processStep: function(step, cb) {
        var self = this;

        if (step.log) {
            cc.log("guide: <" + step.log + ", step begin >");
        }

        var finish = function() {

            self._guideLayer.stopFingerAction(false);
            if (step.log) {
                cc.log("guide: <" + step.log + ", step finished >");
            }

            if (step.delayTime) {
                setTimeout(cb, step.delayTime * 1000);
            } else {
                cb();
            }
        };

        //var command = this._commands[step.command];
        //command(step, finish);

        switch (step.command) {
            //设置属性
            case sz.GuideCommand.GC_SET_PROPERTY:
                this._guideLayer.locateNode(step.locator, function(node) {
                    var property = step.args[0];
                    var args = step.args.slice(1);
                    node[property].apply(node, args);
                });
                break;
            //手型提示
            case sz.GuideCommand.GC_FINGER_HINT:
                this._guideLayer.locateNode(step.locator, function(node) {
                    self._guideLayer.fingerToNode(node, finish, true);
                    if (step.showMask) {
                        self._guideLayer.showMask(true);
                    }
                    if (step.onLocateNode) {
                        step.onLocateNode.call(self._guideLayer, node);
                    }
                });
                break;
            //保存进度
            case sz.GuideCommand.GC_SAVE_PROGRESS:
                this._guideLayer.saveProgress(false, finish);
                break;
            case sz.GuideCommand.GC_NULL:
                finish();
                break;
            default:
                cc.log("guide command is not define");
        }
    }
});

/**
 * 引导界面类
 * @type {void|*}
 */
sz.GuideLayer = cc.Layer.extend({
    _index: null,       //引导序号
    _target: null,      //引导类对依附的主界面
    _finger: null,      //手型精灵
    _guideConfig: null, //引导配置对象
    _touchRect: null,   //可色触摸矩形区
    _locateNode: null,  //定位节点
    _guideTaskHandle: null, //引导任务处理器
    ctor: function(target, guidConfig) {
        cc.assert(target || guidConfig);
        this._super();
        this._index = 0;
        this._target = target;
        this._guideConfig = guidConfig;
        this._initFinger();
        this._target.addChild(this, 100000000);
    },

    /**
     * 创建任务处理器，可以子类重写
     * @returns {sz.GuideTaskHandle}
     * @private
     */
    _createTaskHandle: function() {
        return new sz.GuideTaskHandle(this, this._guideConfig);
    },

    onEnter: function() {
        this._super();
        if (this._guideTaskHandle) {
            return;
        }

        this._guideTaskHandle = this._createTaskHandle();

        //为layer注册触摸事件，默认使用sz.UIloadero
        var self = this;
        if (sz.uiloader) {

            sz.uiloader.registerTouchEvent(this);
            this._widgetEvent = sz.uiloader._onWidgetEvent;
            sz.uiloader._onWidgetEvent = function(sender, type) {
                if (self._widgetEvent) {
                    self._widgetEvent.call(sz.uiloader, sender, type);
                }
                self._onWidgetEvent(sender, type);
            };
        } else {
            //兼容没有使用sz.UILoader时，注册事件
            var touchListener = cc.EventListener.create({
                event: cc.EventListener.TOUCH_ONE_BY_ONE,
                swallowTouches: true,
                onTouchBegan: function(touch, event) {
                    var touchNode = event.getCurrentTarget();
                    var ret = self._onTouchBegan(touchNode, touch, event);
                    return ret ? true : false;
                }
            });
            cc.eventManager.addListener(touchListener, this);
        }
    },

    saveProgress: function(isForward, cb) {
        var localStorage = localStorage || cc.sys.localStorage;

        localStorage.setItem(sz.GuideIndexName, isForward ? ++this._index : this._index + 1);

        if (cb) {
            cb();
        }
    },

    loadProgress: function() {
        var localStorage = localStorage || cc.sys.localStorage;
        this._index = parseInt(localStorage.getItem(sz.GuideIndexName)) || 0;
    },

    /**
     * 初始化手型提示
     * @private
     */
    _initFinger: function() {
        this._finger = new cc.Sprite(this._guideConfig.fingerImage);
        this._finger.setPosition(this.width * 0.5, this.height * 0.5);
        this._finger.setAnchorPoint(0, 1);
        this._finger.setVisible(false);
        this.addChild(this._finger);
    },

    /**
     * 手型指向定位节点
     * @param locateNode
     * @param cb
     * @private
     */
    fingerToNode: function(locateNode, callback, isAnimation) {
        this._setLocateNode(null);
        var point = locateNode.getParent().convertToWorldSpace(locateNode.getPosition());
        this._fingerToPoint(point, isAnimation);
        point.x -= locateNode.width * locateNode.anchorX;
        point.y -= locateNode.height * locateNode.anchorY;
        this._touchRect = cc.rect(point.x, point.y, locateNode.width, locateNode.height);
        if (locateNode instanceof ccui.Widget && locateNode.isTouchEnabled()) {
            this._setLocateNode(locateNode);
        }
        this.showMask();
        //保存任务完成回调函数
        this._setpCallback = callback;
    },

    /**
     * 手型动画，指向指定位置
     * @param point
     * @param isAnimation
     */
    _fingerToPoint: function(point, isAnimation) {
        this._finger.stopAllActions();
        this._finger.setScale(1);
        this._finger.setVisible(true);

        if (point && isAnimation) {
            var width  = this._finger.x - point.x;
            var height = this._finger.y - point.y;
            var length = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));

            var moveTo = cc.moveTo(length / (this.width * 1) , point);
            var action = cc.sequence(moveTo, cc.callFunc(function() {
                var scaleBy = cc.scaleBy(0.3, 0.8);
                var scaleBy2 = cc.scaleTo(0.3, 1);
                var sequence = cc.sequence(scaleBy, scaleBy2);
                this._finger.runAction(cc.repeatForever(sequence));
            }, this));
            this._finger.runAction(action);
        } else if (point) {
            this._finger.setPosition(point);
        }
    },

    /**
     * 手型精灵依次在多个座标点中移动
     * @param pointArray
     * @param time
     * @param isRepeat
     */
    _fingerToPointArray: function(pointArray, time, isRepeat) {
        var array = [];
        var firstPoint = pointArray.shift();
        this._finger.setPosition(firstPoint);
        this._finger.stopAllActions();
        this._finger.setVisible(true);
        _.each(pointArray, function(pt, index) {
            var moveTo = cc.moveTo(time, pt);
            if (index === 0) {
                array.push(cc.spawn(moveTo, cc.fadeIn(time)));
            } else {
                array.push(moveTo);
            }
        });

        //延时1秒
        array.push(cc.spawn(cc.delayTime(0.5), cc.fadeOut(0.5)));
        array.push(cc.callFunc(function() {
            this._finger.setPosition(firstPoint);
            this._finger.setOpacity(150);
        }, this));
        var action = cc.sequence(array);
        if (isRepeat) {
            action = cc.repeatForever(action);
        }

        this._finger.runAction(action);
    },

    /**
     * 停止手型提示
     * @param visible
     */
    stopFingerAction: function(visible) {
        this._finger.stopAllActions();
        if (typeof visible === 'boolean') {
            this._finger.setVisible(visible);
        }
    },

    /**
     * 触摸事件，检查定位区
     * @param touch
     * @returns {boolean}
     */
    _onTouchBegan: function(sender, touch) {
        //可触摸矩形区不存在退出
        if (!this._touchRect) {
            return false;
        }

        var point = touch.getLocation();
        var isContains = cc.rectContainsPoint(this._touchRect, point);
        if (isContains && !this._locateNode) {
            this._setLocateNode(null);
            this._setpCallback();
        }

        return !isContains;
    },

    /**
     * widget控件事件
     * @param sender
     * @param type
     * @private
     */
    _onWidgetEvent: function(sender, type) {
        //检查是否命中控件
        var isHitWidget = this._locateNode && (sender === this._locateNode || sender.getName() === this._locateNode.getName());

        var stepConfig = this._guideTaskHandle.getCurStepConfig();
        if (isHitWidget && (stepConfig.eventType === type || this._guideConfig.eventType === type)) {
            this._setLocateNode(null);
            this._setpCallback();
        }

    },

    /**
     * 设置定位节点
     * @param node
     * @private
     */
    _setLocateNode: function(node) {
        if (this._locateNode) {
            this._locateNode.release();
        }

        this._locateNode = node;
        if (node) {
            node.retain();
        } else {
            this._touchRect = null;
        }
    },

    /**
     * 通过定位器字符串，定位节点
     * @param locator
     * @param cb
     */
    locateNode: function(locator, cb) {
        var node = sz.Locator.locateNode(this._target, locator, cb);
        if (!node) {
            this.scheduleOnce(function() {
                this.locateNode(locator, cb);
            }, this._guideConfig.locateNodeDurationTime || 0.1);
        }
    },

    /**
     * 显示遮罩层
     */
    showMask: function(isForce) {

        if (!isForce && !this._guideConfig.isShowMask) {
            if (this._clipper) {
                this._clipper.setVisible(false);
            }
            return;
        }

        var stencil;
        if (!this._clipper) {
            stencil = new cc.LayerColor();//cc.DrawNode();
            var clipper = new cc.ClippingNode();
            clipper.stencil = stencil;
            this.addChild(clipper, -1);
            clipper.setInverted(true);
            var content = new cc.LayerColor(cc.color.RED);
            content.setOpacity(150);
            clipper.addChild(content);
            this._clipper = clipper;
        } else {
            stencil = this._clipper.stencil;
        }
        this._clipper.setVisible(true);
        stencil.setContentSize(this._touchRect.width, this._touchRect.height);
        stencil.setPosition(this._touchRect.x, this._touchRect.y);
    },

    destory: function() {
        if (this._widgetEvent) {
            sz.uiloader._onWidgetEvent = this._widgetEvent;
        }
        this._guideTaskHandle = null;
        this.removeFromParent();
        cc.log("----guide over----");
    }
});
