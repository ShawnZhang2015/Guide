sz.Guide
========

cocos2d-js游戏简单引导框架

##在线演示
www.ixuexie.com/Guide/index.html

## 博客教程

[一、原理和框架](http://blog.csdn.net/6346289/article/details/44001005)
[二、定位器细节](http://blog.csdn.net/6346289/article/details/44150147)
[三、框架分析](http://blog.csdn.net/6346289/article/details/44586595)
[四、使用方法](http://blog.csdn.net/6346289/article/details/44745771)

## 快速使用

### 创建引导层
```javascript
//在Layer的onEnter时创建引导层对象(sz.GuideLayer)
onEnter: function() {
    this._super();
    //guideConfig 为引导配置对象
    new sz.GuideLayer(this, guideConfig);
}
```
### 引导配置

导引配置主要是编写**引导任务**, 引导任务可能由1个或多个引导步骤组成。当任务中的步骤全部完成sz.Guide会自动保存进度。
```javascript
tasks = {
	'任务1':[
	//任务数组中，每一个对象为一个step
	{
		log: '用于调试日志字符串',
		//引导指令：手型提示
		command: sz.GuideCommand.GC_FINGER_HINT,
		//定位器
		locator:'定位器字符串，一般为节点的Name'
	}
	],
	'任务2':[...]
	'任务3':[...]
}
```

###定位器语法
>“/” ：名字（name）定位符，例如： ‘a/b/c’ 、’dialogLayer/_closeButton’
>“#”：tag（id）定位符，例如：’a#123’
>“.”：变量名（var）定位符，例如：’a._okButton’
>“>”：子节点（child）定位符，例如：’a>c’


参请见代码guideConfig.js文件