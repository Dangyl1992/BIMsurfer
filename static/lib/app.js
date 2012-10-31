/*
 * BIMsurfer
 * Copyright 2012, Bimsurfer.org.
 * 
 * started by L�on van Berlo, BIMserver.org / TNO
 * created by Rehno Lindeque
 * enhanced by Kaltenriner Cristoph, Leichtfried Michael, TU Vienna, 2012
 */
"use strict";

(function() {
	  var bimserverImport, bimserverImportDialogClearMessages, bimserverImportDialogLoad, bimserverImportDialogLogin, 
	  	bimserverImportDialogRefresh, bimserverImportDialogSelect, bimserverImportDialogShow, bimserverImportDialogShowTab1, 
	  	bimserverImportDialogShowTab2, bimserverImportDialogToggleTab2, canvasCaptureThumbnail, canvasInit, constants, controlsInit, 
	  	controlsNavigateLink, controlsPropertiesSelectObject, controlsShowProperties, controlsToggleLayer, controlsToggleTreeOpen, 
	  	controlsToggleTreeVisibility, controlsTreeSelectObject, setExposeLevel, exposeSelectedStorey, getBuildingStoreys, getSelectedStoreyWalls, 
	  	setTransparentLevel, insertTransparentNodes, fileImportDialogLoad, fileImportDialogShow, filterChanged, filterObjects, escape,helpShortcuts, helpShortcutsHide, 
	  	helpStatus, helpStatusClear, hideDialog, highlightElements, ifcTreeInit, initLoadModel, keyDown, lerpLookAt, lerpLookAtNode, loadScene, lookAtNodePanRelative, lookAtPanRelative, 
	  	lookAtToQuaternion, mainmenuViewsReset, mainmenuViewsFront, mainmenuViewsSide, mainmenuViewsTop, togglePanRotate, btnZoomIn, btnZoomOut, setZoomLevel, setView,
	  	modifySubAttr, mouseCoordsWithinElement, mouseDown, mouseMove, mouseUp, mouseWheel, controlsTreeScrollToSelected, orbitLookAt, orbitLookAtNode, parseQueryArguments, 
	  	recordToVec3, recordToVec4, registerControlEvents, registerDOMEvents, sceneInit, snapshotsDelete, snapshotsPlay, snapshotsPush, 
	  	snapshotsToggle, state, topmenuHelp, topmenuImportBimserver, topmenuImportSceneJS, topmenuModeAdvanced, topmenuModeBasic, 
	  	topmenuPerformancePerformance, topmenuPerformanceQuality, vec3ToRecord, vec4ToRecord, viewportInit, windowResize, zoomLookAt, 
	  	zoomLookAtNode, setNavigationMode, getNavigationMode, resetView, restoreSpecialObjectHighlight, setViewToObject, setWarning, snapshotsPushObject,
	  	orbitLookAtNodeSnapshots, handleStart, setZoomLevelAbsolut, deleteHighlights, controlsDoubleClickFilter, controlsDoubleClickOverview, doSetViewToObject, setExposeSlider,
	    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  /*
   * IDs with special characters like the $ sign needs to be escaped. In the case of $ in ids, a jquery statement will fail.
   */
  RegExp.escape = function(str) {
	return str.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
  };

  canvasCaptureThumbnail = function(srcCanvas, srcWidth, srcHeight, destWidth, destHeight) {
    var clipHeight, clipWidth, clipX, clipY, h, imgURI, thumbCanvas, thumbCtx, w;
    thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = destWidth;
    thumbCanvas.height = destHeight;
    thumbCtx = thumbCanvas.getContext('2d');
    w = ($(srcCanvas)).width();
    h = ($(srcCanvas)).height();
    clipWidth = Math.min(w, srcWidth);
    clipHeight = Math.min(h, srcHeight);
    clipX = Math.floor((w - clipWidth) / 2);
    clipY = Math.floor((h - clipHeight) / 2);
    thumbCtx.drawImage(srcCanvas, clipX, clipY, clipWidth, clipHeight, 0, 0, destWidth, destHeight);
    imgURI = thumbCanvas.toDataURL('image/png');
    return imgURI;
  };

  modifySubAttr = function(node, attr, subAttr, value) {
    var attrRecord;
    attrRecord = node.get(attr);
    attrRecord[subAttr] = value;
    return node.set(attr, attrRecord);
  };

  recordToVec3 = function(record) {
    return [record.x, record.y, record.z];
  };

  recordToVec4 = function(record) {
    return [record.x, record.y, record.z, record.w];
  };

  vec3ToRecord = function(vec) {
    return {
      x: vec[0],
      y: vec[1],
      z: vec[2]
    };
  };

  vec4ToRecord = function(vec) {
    return {
      x: vec[0],
      y: vec[1],
      z: vec[2],
      w: vec[3]
    };
  };

  lookAtToQuaternion = function(lookAt) {
    var eye, look, up, x, y, z;
    eye = recordToVec3(lookAt.eye);
    look = recordToVec3(lookAt.look);
    up = recordToVec3(lookAt.up);
    x = [0.0, 0.0, 0.0];
    y = [0.0, 0.0, 0.0];
    z = [0.0, 0.0, 0.0];
    SceneJS_math_subVec3(look, eye, z);
    SceneJS_math_cross3Vec3(up, z, x);
    SceneJS_math_cross3Vec3(z, x, y);
    SceneJS_math_normalizeVec3(x);
    SceneJS_math_normalizeVec3(y);
    SceneJS_math_normalizeVec3(z);
    return SceneJS_math_newQuaternionFromMat3(x.concat(y, z));
  };

  orbitLookAt = function(dAngles, orbitUp, lookAt) {
    var axes, axesNorm, dAngle, eye0, eye1, look, result, rotAxis, rotMat, tangent1, tangentError, transformedX, transformedZ, up0, up1;
    if (dAngles[0] === 0.0 && dAngles[1] === 0.0) {
      return {
        eye: lookAt.eye,
        look: lookAt.look,
        up: lookAt.up
      };
    }
    eye0 = recordToVec3(lookAt.eye);
    up0 = recordToVec3(lookAt.up);
    look = recordToVec3(lookAt.look);
    axes = [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]];
    axesNorm = [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]];
    SceneJS_math_subVec3(eye0, look, axes[2]);
    SceneJS_math_cross3Vec3(up0, axes[2], axes[0]);
    SceneJS_math_normalizeVec3(axes[0], axesNorm[0]);
    SceneJS_math_normalizeVec3(axes[2], axesNorm[2]);
    SceneJS_math_cross3Vec3(axesNorm[2], axesNorm[0], axesNorm[1]);
    rotAxis = [axesNorm[0][0] * -dAngles[1] + axesNorm[1][0] * -dAngles[0], axesNorm[0][1] * -dAngles[1] + axesNorm[1][1] * -dAngles[0], axesNorm[0][2] * -dAngles[1] + axesNorm[1][2] * -dAngles[0]];
    dAngle = SceneJS_math_lenVec2(dAngles);
    rotMat = SceneJS_math_rotationMat4v(dAngle, rotAxis);
    transformedX = SceneJS_math_transformVector3(rotMat, axesNorm[0]);
    transformedZ = SceneJS_math_transformVector3(rotMat, axes[2]);
    eye1 = [0.0, 0.0, 0.0];
    SceneJS_math_addVec3(look, transformedZ, eye1);
    tangent1 = transformedX;
    tangentError = [0.0, 0.0, 0.0];
    SceneJS_math_mulVec3(tangent1, orbitUp, tangentError);
    SceneJS_math_subVec3(tangent1, tangentError);
    up1 = [0.0, 0.0, 0.0];
    SceneJS_math_cross3Vec3(transformedZ, tangent1, up1);
    return result = {
      eye: vec3ToRecord(eye1),
      look: lookAt.look,
      up: vec3ToRecord(up1)
    };
  };

  orbitLookAtNode = function(node, dAngles, orbitUp) {
    return node.set(orbitLookAt(dAngles, orbitUp, {
      eye: node.get('eye'),
      look: node.get('look'),
      up: node.get('up')
    }));
  };

  zoomLookAt = function(distance, limits, lookAt) {
    var eye0, eye0len, eye1, eye1len, look, result;
    eye0 = recordToVec3(lookAt.eye);
    look = recordToVec3(lookAt.look);
    eye0len = SceneJS_math_lenVec3(eye0);
    eye1len = Math.clamp(eye0len + distance, limits[0], limits[1]);
    eye1 = [0.0, 0.0, 0.0];
    SceneJS_math_mulVec3Scalar(eye0, eye1len / eye0len, eye1);
    return result = {
      eye: vec3ToRecord(eye1),
      look: lookAt.look,
      up: lookAt.up
    };
  };

  zoomLookAtNode = function(node, distance, limits) {
    return node.set(zoomLookAt(distance, limits, {
      eye: node.get('eye'),
      look: node.get('look'),
      up: node.get('up')
    }));
  };

  lookAtPanRelative = function(dPosition, lookAt) {
    var axes, dPositionProj, eye, look, result, up;
    if (dPosition[0] === 0.0 && dPosition[1] === 0.0) {
      return {
        eye: lookAt.eye,
        look: lookAt.look,
        up: lookAt.up
      };
    }
    eye = recordToVec3(lookAt.eye);
    look = recordToVec3(lookAt.look);
    up = recordToVec3(lookAt.up);
    axes = [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]];
    SceneJS_math_subVec3(eye, look, axes[2]);
    SceneJS_math_cross3Vec3(up, axes[2], axes[0]);
    SceneJS_math_normalizeVec3(axes[0]);
    SceneJS_math_cross3Vec3(axes[2], axes[0], axes[1]);
    SceneJS_math_normalizeVec3(axes[1]);
    SceneJS_math_mulVec3Scalar(axes[0], dPosition[0]);
    SceneJS_math_mulVec3Scalar(axes[1], dPosition[1]);
    dPositionProj = [0.0, 0.0, 0.0];
    SceneJS_math_addVec3(axes[0], axes[1], dPositionProj);
    return result = {
      eye: vec3ToRecord(SceneJS_math_addVec3(eye, dPositionProj)),
      look: vec3ToRecord(SceneJS_math_addVec3(look, dPositionProj)),
      up: lookAt.up
    };
  };

  lookAtNodePanRelative = function(node, dPosition) {
    return node.set(lookAtPanRelative(dPosition, {
      eye: node.get('eye'),
      look: node.get('look'),
      up: node.get('up')
    }));
  };

  lerpLookAt = function(t, lookAt0, lookAt1) {
    var q, q0, q1, result;
    q0 = lookAtToQuaternion(lookAt0);
    q1 = lookAtToQuaternion(lookAt1);
    q = SceneJS_math_slerp(t, q0, q1);
    return result = {
      eye: SceneJS_math_lerpVec3(t, 0.0, 1.0, lookAt0.eye, lookAt1.eye),
      look: SceneJS_math_lerpVec3(t, 0.0, 1.0, lookAt0.look, lookAt1.look),
      up: vec3ToRecord(SceneJS_math_newUpVec3FromQuaternion(q))
    };
  };

  lerpLookAtNode = function(node, t, lookAt0, lookAt1) {
    return node.set(lerpLookAt(t, lookAt0, lookAt1));
  };

  SceneJS.FX = {};

  SceneJS.FX.Tween = {};

  SceneJS.FX.TweenSpline = (function() {
    var TweenSpline, _dt, _intervalID, _r, _tick, _tweens;
    TweenSpline = (function() {

      function TweenSpline(lookAtNode, play) {
        this._target = lookAtNode;
        this._sequence = [];
        this._timeline = [];
        this._play = play != null ? play : true;
        this._t = 0.0;
      }

      TweenSpline.prototype.tick = function(dt) {
        if (this._play) return this._t += dt;
      };

      TweenSpline.prototype.start = function(lookAt) {
        this._sequence = [
          lookAt != null ? lookAt : {
            eye: this._target.get('eye'),
            look: this._target.get('look'),
            up: this._target.get('up')
          }
        ];
        this._timeline = [0.0];
        return this._t = 0.0;
      };

      TweenSpline.prototype.push = function(lookAt, dt) {
        var dt_prime;
        if (this._sequence.length === 0) this._t = 0.0;
        dt_prime = dt != null ? dt : 5000;
        if (this._timeline.length === 0) dt_prime = 0.0;
        this._timeline.push(this.totalTime() + dt_prime);
        return this._sequence.push(lookAt);
      };

      TweenSpline.prototype.sequence = function(lookAts, dt) {
        var dt_prime, lookAt, _i, _len;
        if (this._sequence.length === 0) this._t = 0.0;
        for (_i = 0, _len = lookAts.length; _i < _len; _i++) {
          lookAt = lookAts[_i];
          dt_prime = dt != null ? dt : 800; //speedfactor of playing sequences
          if (this._timeline.length === 0) dt_prime = 0.0;
          this._timeline.push(this.totalTime() + dt_prime);
          this._sequence.push(lookAt);
        }
        return null;
      };

      TweenSpline.prototype.pause = function() {
        return this._play = false;
      };

      TweenSpline.prototype.play = function() {
        return this._play = true;
      };

      TweenSpline.prototype.totalTime = function() {
        if (this._timeline.length > 0) {
          return this._timeline[this._timeline.length - 1];
        }
        return 0;
      };

      TweenSpline.prototype.update = function() {
        var dt, i;
        if (this._sequence.length === 0) return false;
        if (!this._play) return true;
        if (this._t >= this.totalTime() || this._sequence.length === 1) {
          this._target.set(this._sequence[this._sequence.length - 1]);
          return false;
        }
        i = 0;
        while (this._timeline[i] <= this._t) {
          ++i;
        }
        dt = this._timeline[i] - this._timeline[i - 1];
        lerpLookAtNode(this._target, (this._t - this._timeline[i - 1]) / dt, this._sequence[i - 1], this._sequence[i]);
        return true;
      };

      return TweenSpline;

    })();
    _tweens = [];
    _intervalID = null;
    _dt = 0;
    _tick = function() {
      var tween, _i, _len;
      for (_i = 0, _len = _tweens.length; _i < _len; _i++) {
        tween = _tweens[_i];
        tween.tick(_dt);
      }
      return null;
    };
    _r = function(lookAtNode, interval) {
      var tween;
      _dt = interval || 50;
      if (_intervalID !== null) clearInterval(_intervalID);
      _intervalID = setInterval(_tick, _dt);
      tween = new TweenSpline(lookAtNode);
      _tweens.push(tween);
      return tween;
    };
    _r.update = function() {
      var i, tween, _results;
      i = 0;
      _results = [];
      while (i < _tweens.length) {
        tween = _tweens[i];
        if (!tween.update()) {
          _results.push(_tweens.splice(i, 1));
        } else {
          _results.push(i += 1);
        }
      }
      return _results;
    };
    return _r;
  })();

  SceneJS.FX.idle = function() {
    SceneJS.FX.TweenSpline.update();
    return null;
  };

  constants = {
    camera: {
      maxOrbitSpeed: Math.PI * 0.1,
      orbitSpeedFactor: 0.05,
      zoomSpeedFactor: 0.05,
      panSpeedFactor: 0.6
    },
    mouse: {
      pickDragThreshold: 10
    },
    canvas: {
      defaultSize: [1024, 512],
      topOffset: 122
    },
    thumbnails: {
      size: [125, 100],
      scale: 2
    },
    //Highlight Information for special objects
    highlightSpecialObject: {
    	type: 'material',
    	name: "specialhighlight",
	    emit:           0.4,
	    baseColor:      { r: 0.16, g: 0.42, b: 0.61 },
	    shine: 10.0,
	    nodes: [
	            {
	            	type: 'flags',
		            flags:
		            {
		                specular: false,      // set specular false
		            }
	            }
        ]
	},
	//Highlight Information for a selected special object
    highlightSelectedSpecialObject: {
    	type: 'material',
    	id: 'specialselectedhighlight',
    	emit: 1,
    	baseColor: {
    		r: 0.16,
    		g: 0.70,
    		b: 0.88
    	},
	    shine: 10.0
    },
    //Highlight Information for a Warning Objects
    highlightWarning: {
    	type: 'material',
    	coreid: 'warninghighlight',
    	emit: 1,
    	baseColor: {
    		r: 1,
    		g: 0,
    		b: 0
    	}
    },
    highlightMaterial: {
        type: 'material',
        id: 'highlight',
        emit: 0.0,
        baseColor: {
          r: 0.0,
          g: 0.5,
          b: 0.5
        }
    }
  };

  Math.clamp = function(s, min, max) {
    return Math.min(Math.max(s, min), max);
  };

  state = {
    scene: (function() {
      try {
        return SceneJS.scene('Scene');
      } catch (error) {
        return null;
      }
    })(),
    canvas: document.getElementById('scenejsCanvas'),
    settings: {
      performance: 'quality',
      mode: 'basic'
    },
    viewport: {
      domElement: document.getElementById('viewport'),
      selectedIfcObject: null,
      mouse: {
        last: [0, 0],
        leftDown: false,
        middleDown: false,
        leftDragDistance: 0,
        middleDragDistance: 0,
        pickRecord: null
      }
    },
    queryArgs: {},
    camera: {
      distanceLimits: [0.0, 0.0]
    },
    //Variables for BPI.MOST Features (TU Vienna)
    propertyValues: {
    	scalefactor: 0,
    	viewfactor: 0,
    	selectedObj: 'emtpy Selection',
    	mouseRotate: 0,
    	oldZoom: 15,
    	boundfactor: 0
      },
    lookAt: {
      defaultParameters: {
        look: {
          x: 0.0,
          y: 0.0,
          z: 0.0
        },
        eye: {
          x: 10.0,
          y: 10.0,
          z: 10.0
        },
        up: {
          x: 0.0,
          y: 0.0,
          z: 1.0
        }
      }
    },
    snapshots: {
      lookAts: []
    },
    application: {
      initialized: false
    }
  };

  mouseCoordsWithinElement = function(event) {
    var coords, element, totalOffsetLeft, totalOffsetTop;
    coords = [0, 0];
    if (!event) {
      event = window.event;
      coords = [event.x, event.y];
    } else {
      element = event.target;
      totalOffsetLeft = 0;
      totalOffsetTop = 0;
      while (element.offsetParent) {
        totalOffsetLeft += element.offsetLeft;
        totalOffsetTop += element.offsetTop;
        element = element.offsetParent;
      }
      coords = [event.pageX - totalOffsetLeft, event.pageY - totalOffsetTop];
    }
    return coords;
  };

  windowResize = function() {
    var cameraNode, cameraOptics;
    switch (state.settings.performance) {
      case 'performance':
        state.canvas.width = constants.canvas.defaultSize[0];
        state.canvas.height = constants.canvas.defaultSize[1];
        break;
      case 'quality':
        state.canvas.width = ($('#viewport')).width();
        state.canvas.height = ($('#viewport')).height();
    }
    if (state.scene != null) {
      cameraNode = state.scene.findNode('main-camera');
      cameraOptics = cameraNode.get('optics');
      cameraOptics.aspect = state.canvas.width / state.canvas.height;
      return cameraNode.set('optics', cameraOptics);
    }
  };

  mouseDown = function(event) {
    var coords, picknode;
    if (!(state.scene != null)) return;
    
    state.viewport.mouse.last = [event.clientX, event.clientY];
    switch (event.which) {
	    case 1:
	      state.viewport.mouse.leftDown = true;
	      break;
	    case 2:
	      state.viewport.mouse.middleDown = true;
    }
    if (event.which === 1) {
      coords = mouseCoordsWithinElement(event);
      //check if selected Object is a special object
      state.viewport.mouse.pickRecord = state.scene.pick(coords[0], coords[1]);
      if (state.viewport.mouse.pickRecord != null) {
    	  picknode = state.scene.findNode(state.viewport.mouse.pickRecord.name);
    	  //if selected element begins with dp_ (marks special object)
    	  if ($('#'+RegExp.escape(picknode.get("id"))).text().match(/^ dp_/)){
    		  if(state.propertyValues.selectedObj == ($('#'+RegExp.escape(picknode.get("id"))).text())) {
    			  console.log("No special object selected");
    		  } else {
    			  state.propertyValues.selectedObj = ($('#'+RegExp.escape(picknode.get("id"))).text());  
    		  }		  	  
    		  state.viewport.mouse.leftDown = false;
    		  event.preventDefault();
    	  }else{
    		  state.propertyValues.selectedObj = 'emtpy Selection';
    	  }
      }
      return 0;
    }
  };

  mouseUp = function(event) {
    if (!(state.scene != null)) return;
    if (event.which === 1 && state.viewport.mouse.leftDragDistance < constants.mouse.pickDragThreshold && state.viewport.mouse.middleDragDistance < constants.mouse.pickDragThreshold) {
      if (state.viewport.mouse.pickRecord != null) {
    	  controlsTreeSelectObject(state.viewport.mouse.pickRecord.name);
    	  controlsTreeScrollToSelected();
          if (state.propertyValues.selectedObj != 'emtpy Selection'){
          }  
      } else {
        controlsTreeSelectObject();
        helpShortcutsHide('selection');
      }
      state.viewport.mouse.pickRecord = null;
    }
    //switch between Navigation Mode (pan/rotate)
    var navigationMode = getNavigationMode();
    switch(navigationMode)
    {
		case 0:
		    state.viewport.mouse.leftDragDistance = 0;
		    break;
		case 1:
		    state.viewport.mouse.middleDragDistance = 0;
		    break;
    }
    switch (event.which) {
      case 1:
        state.viewport.mouse.leftDown = false;
        return state.viewport.mouse.leftDragDistance = 0;
      case 2:
        state.viewport.mouse.middleDown = false;
        return state.viewport.mouse.middleDragDistance = 0;
    }
  };

  mouseMove = function(event) {
    var delta, deltaLength, orbitAngles, panVector;
    
    delta = [event.clientX - state.viewport.mouse.last[0], event.clientY - state.viewport.mouse.last[1]];
    if(delta[0] == 0 || delta [1] == 0) return;  //avoids disappearing object
    deltaLength = SceneJS_math_lenVec2(delta);
    if (state.viewport.mouse.leftDown) {
      //check which navigation mode is activated	
      if (getNavigationMode() == 0){
    	  state.viewport.mouse.leftDragDistance += deltaLength; 
      }
      else{
    	  state.viewport.mouse.middleDragDistance += deltaLength;
      }
      
    }
    if (state.viewport.mouse.middleDown) {
      state.viewport.mouse.middleDragDistance += deltaLength;
    }
    if (state.viewport.mouse.leftDown && event.which === 1) {
    	if (getNavigationMode() == 0){
	      orbitAngles = [0.0, 0.0];
	      SceneJS_math_mulVec2Scalar(delta, constants.camera.orbitSpeedFactor / deltaLength, orbitAngles);
	      orbitAngles = [Math.clamp(orbitAngles[0], -constants.camera.maxOrbitSpeed, constants.camera.maxOrbitSpeed), Math.clamp(orbitAngles[1], -constants.camera.maxOrbitSpeed, constants.camera.maxOrbitSpeed)];
	      if ((isNaN(orbitAngles[0])) || (Math.abs(orbitAngles[0])) === Infinity) {
	        orbitAngles[0] = 0.0;
	      }
	      if ((isNaN(orbitAngles[1])) || (Math.abs(orbitAngles[1])) === Infinity) {
	        orbitAngles[1] = 0.0;
	      }
	      orbitLookAtNode(state.scene.findNode('main-lookAt'), orbitAngles, [0.0, 0.0, 1.0]);
    	}else{
	      panVector = [0.0, 0.0];
	      SceneJS_math_mulVec2Scalar([-delta[0], delta[1]], constants.camera.panSpeedFactor * 1/state.propertyValues.scalefactor  / deltaLength, panVector);
	      lookAtNodePanRelative(state.scene.findNode('main-lookAt'), panVector);
    	}
    } 
    else if (state.viewport.mouse.middleDown && event.which === 2) {
      panVector = [0.0, 0.0];
      SceneJS_math_mulVec2Scalar([-delta[0], delta[1]], constants.camera.panSpeedFactor  * 1/state.propertyValues.scalefactor / deltaLength, panVector);
      lookAtNodePanRelative(state.scene.findNode('main-lookAt'), panVector);
    }
    return state.viewport.mouse.last = [event.clientX, event.clientY];
  };
  
  mouseWheel = function(event) {
    var delta, zoomDistance;
    if (!(state.scene != null)) return;
    delta = event.wheelDelta != null ? event.wheelDelta / -120.0 : Math.clamp(event.detail, -1.0, 1.0);
    state.propertyValues.oldZoom = Math.clamp(state.propertyValues.oldZoom + delta, 0, 20);
    zoomDistance = delta * state.camera.distanceLimits[1] * constants.camera.zoomSpeedFactor;
    return zoomLookAtNode(state.scene.findNode('main-lookAt'), zoomDistance, state.camera.distanceLimits);
  };
  
  /**
   * Sets Rotate or Pan mode (called from GWT)
   * @param _mouseRotate 	an Integer: 0...Rotate, 1...Pan
   */
  window.setNavigationMode = function (_mouseRotate){
	  state.propertyValues.mouseRotate = _mouseRotate;
  }
  
  /**
   * Get Navigation Mode (0 for Rotate and 1 for Pan)
   */
  getNavigationMode = function (event){
	  return state.propertyValues.mouseRotate;
  }

  keyDown = function(event) {
    switch (event.which) {
      case 72:
        return topmenuHelp();
    }
  };

  helpStatus = function(str) {
    return ($('#main-view-help')).html(str);
  };
  
  helpStatusClear = function() {
    return ($('#main-view-help')).html("");
  };

  helpShortcuts = function() {
    var postfix, _i, _len, _results;
    ($('.shortcut')).hide();
    _results = [];
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      postfix = arguments[_i];
      _results.push(($('.shortcut-' + postfix)).show());
    }
    return _results;
  };

  helpShortcutsHide = function() {
    var postfix, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      postfix = arguments[_i];
      _results.push(($('.shortcut-' + postfix)).hide());
    }
    return _results;
  };

  topmenuImportBimserver = function(event) {
    return bimserverImportDialogShow();
  };

  topmenuImportSceneJS = function(event) {
    return fileImportDialogShow();
  };

  topmenuPerformanceQuality = function(event) {
    ($(event.target)).addClass('top-menu-activated');
    ($('#top-menu-performance-performance')).removeClass('top-menu-activated');
    ($('#viewport')).removeClass('viewport-performance');
    state.settings.performance = 'quality';
    return windowResize();
  };

  topmenuPerformancePerformance = function(event) {
    ($(event.target)).addClass('top-menu-activated');
    ($('#top-menu-performance-quality')).removeClass('top-menu-activated');
    ($('#viewport')).addClass('viewport-performance');
    state.settings.performance = 'performance';
    return windowResize();
  };

  topmenuModeBasic = function(event) {
    ($(event.target)).addClass('top-menu-activated');
    ($('#top-menu-mode-advanced')).removeClass('top-menu-activated');
    return state.settings.mode = 'basic';
  };

  topmenuModeAdvanced = function(event) {
    ($(event.target)).addClass('top-menu-activated');
    ($('#top-menu-mode-basic')).removeClass('top-menu-activated');
    return state.settings.mode = 'performance';
  };

  topmenuHelp = function() {
    ($('#top-menu-help')).toggleClass('top-menu-activated');
    ($('#main-view-help')).toggle();
    return ($('#main-view-keys')).toggle();
  };
  
  /**
   * Set camera to view position.
   * Sets predesigned view positions: 0...reset, 1...front, 2...side, 3...top
   * @param view	an Integer: 0...reset, 1...front, 2...side, 3...top
   */
  window.setView = function(view){
	  var lookAtNode;
	  if (state.scene != null) {
		  switch(view){
		  case (0):	//reset
			  resetView();
		  	  state.propertyValues.oldZoom = 15;
			  break;
		  case (1):	//front
		  	  resetView();
		      lookAtNode = state.scene.findNode('main-lookAt');
		      lookAtNode.set('eye', {x: state.propertyValues.viewfactor, y: 0, z: 0});
		      lookAtNode.set('look', {x: 0, y: 0, z: 0});
			  state.propertyValues.oldZoom = 10;
			  break;
		  case (2):	//side
	  	  	  resetView();
	    	  lookAtNode = state.scene.findNode('main-lookAt');
	    	  lookAtNode.set('eye', {x: 0, y: state.propertyValues.viewfactor, z: 0});
	      	  lookAtNode.set('look', {x: 0, y: 0, z: 0});
	    	  state.propertyValues.oldZoom = 10;
			  break;
		  case(3):	//top
	  	      resetView();
	    	  lookAtNode = state.scene.findNode('main-lookAt');
	    	  lookAtNode.set('up', {x: 0, y: 1, z: 0});
	    	  lookAtNode.set('eye', {x: 0, y: 0, z: state.propertyValues.viewfactor});
	      	  lookAtNode.set('look', {x: 0, y: 0, z: 0});
	    	  state.propertyValues.oldZoom = 10;
			  break;
		  }
	  }
	  return 0;
  }
  
  /**
   * Resets the view to predesignd Position.
   */
  resetView = function(event){
	  var lookAtNode;
      lookAtNode = state.scene.findNode('main-lookAt');
  	  lookAtNode.set('eye', state.lookAt.defaultParameters.eye);
  	  lookAtNode.set('look', state.lookAt.defaultParameters.look);
  	  return lookAtNode.set('up', state.lookAt.defaultParameters.up);
  }
  
  /**
   * Set View to start view
   */
  mainmenuViewsReset = function(event) {
	  window.setView(0);
  };
  
  /**
   * Set View to front view
   */
  mainmenuViewsFront = function(event) {
	  window.setView(1);
  };
  
  /**
   * Set View to side view
   */
  mainmenuViewsSide = function(event) {
	  window.setView(2);
  };
  
  /**
   * Set View to top view
   */
  mainmenuViewsTop = function(event) {
	  window.setView(3);
  };
  
  /**
   * Switch between rotate and pan navigation mode
   */
  togglePanRotate = function(event)  {
	  if (getNavigationMode() == 1){
		  window.setNavigationMode(0);
	  }else{
		  window.setNavigationMode(1);
	  }
  };
  
  /**
   * Set zoom level.
   * @param zoomVal		an int, -1 for zoom in, 1 for zoom out
   */
  window.setZoomLevel = function(zoomVal){
	   var zoomDistance;
	   zoomDistance = zoomVal * state.camera.distanceLimits[1] * constants.camera.zoomSpeedFactor;
	   return zoomLookAtNode(state.scene.findNode('main-lookAt'), zoomDistance, state.camera.distanceLimits);
  }
  
  /**
   * Set zoom Level with Absolute Value
   * @param zoomVal		an int in range 0 to 20
   */
  window.setZoomLevelAbsolute = function(zoomVal){
	  
	  var zoomDistance;
	  
	  if ((zoomVal >= 0) && (zoomVal <= 20)){
		var zoomSteps = zoomVal - state.propertyValues.oldZoom;
		  
		zoomDistance = state.camera.distanceLimits[1] * constants.camera.zoomSpeedFactor; 
		zoomDistance = zoomDistance * zoomSteps;
		zoomLookAtNode(state.scene.findNode('main-lookAt'), zoomDistance, state.camera.distanceLimits);
		  
		state.propertyValues.oldZoom = zoomVal;
  	}
	  return 0;
  }
  
  //set Warning is called from an extern Applicatin (GWT)
  /**
   * Marks all Objects from an Array.
   * @param names	a String Array with all Objects to Highlight
   */
  window.setWarning = function(names){
	  
	  var oldHighlight;
	  
	  //delete all old Highlights
	  deleteHighlights();
	  
	  for (var i = 0; i < names.length; i++){
		  var id = ($("ul.controls-tree").find("div:contains(" + names[i] + ")").parent().attr("id")); 
		  var nodeID = state.scene.findNode(id);
		  
		  if (nodeID == null){
			console.log("Set Warning Error: Invalid Object");
		  	return;
	  	  }
		  oldHighlight = state.scene.findNode('highlightspecialobject-' + nodeID.get("id"));
		  if (oldHighlight != null) oldHighlight.splice();
		  nodeID.insert('node', constants.highlightWarning);
	  }
	  return;
  }
  
  /**
   * Translates Object Name into ID
   * @param objName 	a String with the name of an Object
   * @returns doSetViewToObject	a Function to do the setView to Object Action
   */
  window.setViewToObject = function(objName){
	  var objID = ($("ul.controls-tree").find("div:contains(" + objName + ")").parent().attr("id"));
	  return doSetViewToObject(objID);
  }
  
  /**
   * Generates two snapshots and starts camera movement.
   * First snapshot is generated on actual position. For the second snapshot a good View to the 
   * Objects is calculated.
   * 
   * @param objID	a String with the ID of an Object
   */
  doSetViewToObject = function(objID){
	  
	  var deltaPosX, deltaPosY, deltaPosZ, oldHighlight, addTranslate, nodeID, childnode, 
	  endlessstopper, oldSnapshots;
	  
	  //delete actual Highlights, because destination is new highlight
	  deleteHighlights();
	  
	  //get child from wanted Node
	  nodeID = state.scene.findNode(objID);
	  
	  //if there is no scenejs node (node is not a physical object)
	  if (nodeID == null){
		  console.log("No physical Object found!");
		  return;
	  }
	  childnode = nodeID.node(0);
	  
	  //reset values
	  addTranslate = 0;	
	  endlessstopper = 0;
	  
	  //find geometry node if existing
  	  while ((childnode.get("type") != "geometry") && (endlessstopper < 17)){
  		  //if there is a translation add additional displacement
  		  if ((childnode.get("type")) == "translate"){
  			  addTranslate = childnode.get("y");
  		  }
  		  //next childnode
  		  childnode = childnode.node(0);
  		  endlessstopper++;
  	  }
  	  
  	  //if no geometry node is found in 17 steps 
  	  if (endlessstopper == 17){
  		  console.log("No Geometry found!");
  		  return;
  	  }
  	  
  	  if (childnode.get("type") == "geometry"){
		  var pos =  childnode.get("positions");
		  
		  //calculate "look" Position out of 3 Geometric Points of the object
		  deltaPosX = (pos[0] + pos[(pos.length/2)-3] + pos[pos.length-3])/3;
		  deltaPosY = (pos[1] + pos[(pos.length/2)-2] + pos[pos.length-1])/3;
		  deltaPosZ = (pos[2] + pos[(pos.length/2)-1] + pos[pos.length-1])/3;
		  
		  //if some values were not valid
		  if (isNaN(deltaPosX)){
			  console.log("Incorrect Geometry found!");
			  return 0;
		  }
		  oldSnapshots = state.snapshots.lookAts.length
		  //delete all old snapshots
		  for (var i = 0; i < oldSnapshots; i++){
			  snapshotsDelete(i);
		  }
		  
		  //make snapshot from actual position (with parameter false that no thumb is created)
		  snapshotsPush(false);
		  //make snapshot from calculated position (end of camera-movement)
		  snapshotsPushObject(deltaPosX, deltaPosY + addTranslate, deltaPosZ);
		  
		  //Highlight object
		  oldHighlight = state.scene.findNode('highlightspecialobject-' + nodeID.get("id"));
		  if (oldHighlight != null) oldHighlight.splice();
		  if($('#'+RegExp.escape(nodeID.get("id"))).text().match(/^ dp_/))
			  nodeID.insert('node', constants.highlightSelectedSpecialObject);
		  else
			  nodeID.insert('node', constants.highlightMaterial);
    	  //do camera movement
      	  snapshotsPlay();
		  
	  }
	  return 0;
  }
  
  /**
   * Method for obtaining the available Building Storeys.
   */
  getBuildingStoreys = function() {
	  
	  //find building storeys in hierarchy of building
	  return $("ul.controls-tree").find(".controls-tree-postfix:contains('(BuildingStorey)')").closest("li.controls-tree-rel");
  };
  
  
  /**
   * Method for obtaining the corresponding wall objects of the selected element in a Building Storey.
   */
  getSelectedStoreyWalls = function ()
  {
	  return ($('.controls-tree').find('.controls-tree-selected')).closest(".controls-tree-rel:contains('(BuildingStorey)')").find(".controls-tree-rel:contains('(WallStandardCase)')");
  }
  
  
  /**
   * Method for setting the corresponding transparent level adjusted in GWT.
   * @param factor the transparency factor (0 - 100)
   */
  window.setTransparentLevel = function(factor)
  {
	if(state.scene == null) return;
	
	//if a wall element is selected, get the corresponding storey to set this one transparent
    if($('.controls-tree-selected').find(".controls-tree-postfix").text() != "")
    {
    	 var storeyElements = getSelectedStoreyWalls();
    	 for(var i=0; i<storeyElements.size(); i++)
		 {
    		 if($(storeyElements[i]).find(".controls-tree-postfix").text() == "(WallStandardCase)")
			 {
	    		 var nodeId = ($(storeyElements[i])).attr("id");
	    		 insertTransparentNodes(state.scene.findNode(nodeId), factor);
			 }
		 }
    }
    
    //if no element is selected, make all elements of WallStandardCase transparent
    else
	{
    	var sceneData = state.scene.data();
    	var index = sceneData.ifcTypes.indexOf('WallStandardCase');
    	var wallCase = sceneData.ifcTypes[index];
        var wallNode = state.scene.findNode(wallCase.toLowerCase());
        
        //also set the roof transparent
        var roofIndex = sceneData.ifcTypes.indexOf('Roof');
        var roof = sceneData.ifcTypes[roofIndex];
        var roofNode = state.scene.findNode(roof.toLowerCase());
    	
  	  	wallNode.eachNode(
			    function() {
			    	if(this.get('type') === 'name')
			    		insertTransparentNodes(this, factor);
				    },
				    {
				        depthFirst: true   // Descend depth-first into tree
				    }
  	  		);
  	  	
  	  	roofNode.eachNode(
			    function() {
			    	if(this.get('type') === 'name')
			    		insertTransparentNodes(this, factor);
				    },
				    {
				        depthFirst: true   // Descend depth-first into tree
				    }
	  		);
	}
  };
  
  
  /**
   * Method to insert transparent material nodes.
   * @param currentNode the node where the transparency material should be inserted
   * @param factor the transparency factor (0 - 100)
   */
  insertTransparentNodes = function(currentNode, factor)
  {
		//insert a new transparent node if there isn't any
		var transparentMaterial = {
		        type: 'material',
		        id: currentNode.get('id') + '-' + 'transparent-walls',
		        alpha: factor/100.0,
		        
		        nodes: [
		                {
		                	type: 'flags',
		                	coreid: 'flagsTransparent',
	    		            flags: {
	    		                picking : false,     // Picking enabled
	    		                transparent: true,
	    		            }
		                }
	                ]
	    };	
		var insertedMaterial = state.scene.findNode(transparentMaterial.id);
		if(insertedMaterial == null)
		{
			insertedMaterial = currentNode.insert('node', transparentMaterial);
		}
		
		//if there is already a transparent node inserted, update the transparentNode to the new factor 
		else
		{
			//if factor is 100, remove transparency material and set elemnts pickable again
			if(factor == 100)
			{
				insertedMaterial.node(0).splice();
				insertedMaterial.splice();
			}
			else
			{
				insertedMaterial.set('alpha', factor/100.0);
				insertedMaterial.node(0).set('flags', {picking: false, transparent: true});
			}
		}
  };
  
  
  /**
   * Method for setting the corresponding expose level adjusted in GWT.
   * @param factor the expose factor (0 - 150)
   */
  window.setExposeLevel = function(factor)
  {
		if(state.scene == null) return;
		
		var storeyElems;
		var distance = factor/10 * 1/state.propertyValues.scalefactor;
		
		//if an element is selected, get the corresponding storey to expose this one
	    if($('.controls-tree-selected').find(".controls-tree-postfix").text() != "")
	    {
	    	//find the parent node of the selected one, which holds the node id
	    	var parent = ($('.controls-tree').find('.controls-tree-selected')).closest(".controls-tree-rel:contains('(BuildingStorey)')");
	    	exposeSelectedStorey($(parent),distance*-1);
	    }
	    else
    	{
	    	storeyElems = getBuildingStoreys();
	    	for(var i=0; i<storeyElems.size(); i++)
	    	{
				exposeSelectedStorey($(storeyElems[i]),distance*-i);
	    	}
    	}
  };
  
  
  /**
   * Method for exposing a particular Building Storey.
   * @param parent  	the parent node of the storey which should be exposed
   * @param distance 	the distance the storey should be exposed
   */
  exposeSelectedStorey = function($parent, distance) {
	var translateNodeJson, disabledNodes, ids, parentId, parentNode, tag, tagNode, _j, _k, _len1, _len2, _ref, _ref1;
	parentId = $parent.attr('id');
    ids = [parentId];	//array of ids
    
    //find controls-tree-rel (jquery) elements and add them to ids array; they are defined in ifcTreeInit() when tree on the left side is built up; there also the object's ids are defined
    ($parent.find('.controls-tree-rel')).each(function() {  
      return ids.push(this.id);
    });
    _ref = state.scene.data().ifcTypes;  //ifc types; WallStandardCase, Roof, Window, Stair
    for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {  //iterate all ifc Types
      tag = _ref[_j];  //one ifcType of the ifcTypes Array in state.scene.data()
      tag = tag.toLowerCase();
      tagNode = state.scene.findNode(tag);
      if (tagNode != null) {
        tagNode.eachNode((function() {  //for each node (scenejs) under the parent tag node (= ifc Type eg. WallStandardCase)
        	//eachNode performs function on each child node; eachNode(function(), depthFirst)
        	
          var _ref1, id;
          id = this.get("id");
          
          //create a new translate Node; hierarchies with this node attached get translated
          translateNodeJson = { 
            	  type: 'translate',
            	  id: 'translateZone-' + id + '-' + parentId,
            	  x: 0,
                  y: distance,
                  z: 0
          };
          
          if ((this.get('type')) === 'name' && (_ref1 = this.get('id'), __indexOf.call(ids, _ref1) >= 0)) {
        	  
        	var insertedTranslateNode = state.scene.findNode(translateNodeJson.id);
        	if(insertedTranslateNode == null)
        		 insertedTranslateNode = this.insert("node", translateNodeJson);
        	else
        		insertedTranslateNode.set('y', distance);
          }
          return false;
        }), {
          depthFirst: true
        });
      }
    }
    return false;
  };

  /**
   * Sets the expose slider according to the expose level of the selected element
   */
  setExposeSlider = function (id) {
	  var parentId = $('#'+RegExp.escape(id)).parentsUntil('li.controls-tree-rel').parent().attr('id');
	  var translateNode = state.scene.findNode('translateZone-' + id + '-' + parentId);
	  if(translateNode != null) {
		  var sliderMax = ($('#expose')).slider("option" , "max");
		  ($('#expose')).slider("value" , state.propertyValues.scalefactor*10*Math.abs(translateNode.get('y')));
	  }
	  else {
		  ($('#expose')).slider("value" , 0);
	  }
  }
  
  /**
   * Deletes all actual highlights for setting a new highlight
   */
  deleteHighlights = function (){
	  
	  var oldHighlightWarning, oldHighlight;

	  restoreSpecialObjectHighlight();
	  oldHighlightWarning = state.scene.findNode(constants.highlightWarning.id);
	  if (oldHighlightWarning != null) oldHighlightWarning.splice();
	  oldHighlight = state.scene.findNode(constants.highlightMaterial.id);
	  if (oldHighlight != null) oldHighlight.splice();	
	  
	  return 0;
  };
  
  /**
   * Searches for all objects with the specified name or pattern and highlights them.
   * @param pattern		the name or pattern of the elements to be selected
   */
  highlightElements = function(pattern)
  {
	  var foundElements = $('div.controls-tree-item:contains('+pattern+')');
	
	  //iterate all found elements
	  for(var i=0; i<foundElements.length; i++)
	  {
		  var id = $(foundElements[i]).closest('.controls-tree-rel').attr('id');
		  var node = state.scene.findNode(id);
		  if(node != null)
		  {
			  var materialNode = constants.highlightSpecialObject;
			  materialNode.id = 'highlightspecialobject-' + id;
			  node.insert('node', materialNode);
		  }
	  }
  };
  
  /**
   * Restores the default highlighting of a special object after it was selected.
   */
  restoreSpecialObjectHighlight = function()
  {
	  var oldHighlight = state.scene.findNode(constants.highlightSelectedSpecialObject.id);
	  if (oldHighlight != null)
	  {
		  //insert default special-object highlight
		  var materialNode = constants.highlightSpecialObject;
		  materialNode.id = 'highlightspecialobject-' + oldHighlight.parent().get("id");
		  if(state.scene.findNode(RegExp.escape(materialNode.id)) == null)  //if default special-object highlight not added yet
			  oldHighlight.parent().insert('node', materialNode);
		  oldHighlight.splice();
	  }
  };
  
  //checkboxes in "Objects" window left sideSelect; iterates the list of control elements on the left side
  controlsToggleTreeVisibility = function(event) {
	    var $parent, collectNodes, disableNode, disableTagJson, disabledNodes, ids, node, parentId, parentNode, tag, tagNode, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
	    $parent = ($(event.target)).closest('.controls-tree-rel');
	    parentId = $parent.attr('id');
	    ids = [parentId];
	    if (event.target.checked) {
	      disabledNodes = state.scene.findNodes('^disable-.*?-' + RegExp.escape(parentId) + '$');
	      for (_i = 0, _len = disabledNodes.length; _i < _len; _i++) {
	        node = disabledNodes[_i];
	        node.splice();
	      }
	      return;
	    }
	    ($parent.find('.controls-tree-rel')).each(function() {
	      return ids.push(this.id);
	    });
	    _ref = state.scene.data().ifcTypes;
	    for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
	      tag = _ref[_j];
	      tag = tag.toLowerCase();
	      tagNode = state.scene.findNode(tag);
	      disableTagJson = {
	        type: 'tag',
	        tag: 'disable',
	        id: 'disable-' + tag + '-' + parentId
	      };
	      if (tagNode != null) {
	        collectNodes = [];
	        tagNode.eachNode((function() {
	          var _ref1;
	          if ((this.get('type')) === 'name' && (_ref1 = this.get('id'), __indexOf.call(ids, _ref1) >= 0) && (this.parent().get('id')) !== disableTagJson.id) {
	            collectNodes.push(this);
	          }
	          return false;
	        }), {
	          depthFirst: true
	        });
	        for (_k = 0, _len2 = collectNodes.length; _k < _len2; _k++) {
	          node = collectNodes[_k];
	          parentNode = node.parent();
	          disableNode = (_ref1 = parentNode.node(disableTagJson.id)) != null ? _ref1 : (parentNode.add('node', disableTagJson)).node(disableTagJson.id);
	          disableNode.add('node', node.disconnect());
	        }
	      }
	    }
	    return false;
  };
  
  
  controlsPropertiesSelectObject = function(id) {
    var html, key, keyStack, objectProperties, properties, tableItem, tableItemObject, value, _i, _len;
    properties = state.scene.data().properties;
    if (!(id != null)) {
      return ($('#controls-properties')).html("<p class='controls-message'>Select an object to see its properties.</p>");
    }
    if (!(properties != null)) {
      return ($('#controls-properties')).html("<p class='controls-message'>No properties could be found in the scene.</p>");
    }
    keyStack = id.split('/');
    objectProperties = properties;
    for (_i = 0, _len = keyStack.length; _i < _len; _i++) {
      key = keyStack[_i];
      objectProperties = objectProperties[key];
    }
    tableItemObject = function(keyStack, key, value) {
      var html, k, _j, _len2;
      html = "<a class='ifc-link' href='#";
      if ((value.link != null) && typeof value.link === 'string') {
        return html += value.link + ("'>" + value.link + "</a>");
      } else {
        for (_j = 0, _len2 = keyStack.length; _j < _len2; _j++) {
          k = keyStack[_j];
          html += k + "/";
        }
        return html += key + "'>...</a>";
      }
    };
    
    tableItem = function(key, value) {
      var arrayValue, html, i, _ref;
      html = "<li class='controls-table-item'>";
      html += "<label class='controls-table-label'>" + key + "</label>";
      html += "<div class='controls-table-value'>";
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {} else if (Array.isArray(value)) {
        for (i = 0, _ref = value.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
          arrayValue = value[i];
          if (i > 0) html += ",<br>";
          if (typeof arrayValue === 'string' || typeof arrayValue === 'number' || typeof arrayValue === 'boolean') {
            html += arrayValue;
          } else if (typeof value === 'object') {
            html += tableItemObject(keyStack, key, arrayValue);
          } else {
            html += arrayValue;
          }
        }
      } else if (typeof value === 'object') {
        html += tableItemObject(keyStack, key, value);
      } else {
        html += value;
      }
      html += "</div>";
      return html += "</li>";
    };
    html = "<ul class='controls-table'>";
    if (keyStack.length === 1) html += tableItem('Global Id', id);
    if (objectProperties != null) {
      for (key in objectProperties) {
        value = objectProperties[key];
        html += tableItem(key, value);
      }
    }
    html += "</ul>";
    if (!objectProperties) {
      html += "<p class='controls-message'>No additional properties could be found for the object with id '" + id + "'.</p>";
    }
    return ($('#controls-properties')).html(html);
  };

  controlsToggleTreeOpen = function(event) {
    var $parent, id;
    $parent = ($(event.target)).parent();
    id = $parent.attr('id');
    $parent.toggleClass('controls-tree-open');
	 controlsTreeSelectObject(id);
	 return controlsPropertiesSelectObject(id);
  };

  /**
   * Highights in Accordeon selected Objecs in 3D View
   */
  controlsTreeSelectObject = function(id) {
    var $treeItem, node, oldHighlight, oldHighlightDB, oldHighlightWarning, parentEl;
    ($('.controls-tree-selected')).removeClass('controls-tree-selected');
    ($('.controls-tree-selected-parent')).removeClass('controls-tree-selected-parent');
    deleteHighlights();
    if (id != null) {
      setExposeSlider(id);	
      parentEl = document.getElementById(id);
      $treeItem = ($(parentEl)).children('.controls-tree-item');
      $treeItem.addClass('controls-tree-selected');
      ($('.controls-tree:has(.controls-tree-selected)')).addClass('controls-tree-selected-parent');
      
      //set filter element selected if there is any corresponding
      var filterElem = $('#filtered-list').find('#' + RegExp.escape(id));
      if(filterElem != null)
    	  filterElem.addClass("controls-tree-selected");
      controlsPropertiesSelectObject(id);
      node = state.scene.findNode(id);
      if (node != null) {
        //if selected element begins with dp_ (= special object)
  	  	if ($('#'+RegExp.escape(node.get("id"))).text().match(/^ dp_/))
  		{
  	  		var oldHighlight = state.scene.findNode('highlightspecialobject-' + node.get("id"));
  	  		//delete default highlight
  	  		if(oldHighlight != null) oldHighlight.splice();
  	  		//higlight special object
  	  		node.insert('node', constants.highlightSelectedSpecialObject);
  		}
  	  	else
      	  //insert a higlight node to highlight selected element; highlight entire storey by adding a highlight node under parent (original withount parent())
      	  node.insert('node', constants.highlightMaterial);
        helpShortcuts('selection', 'navigation', 'standard');
        if (($('#controls-accordion-properties')).hasClass('ui-accordion-content-active')) {
          return helpShortcutsHide('inspection');
        }
      }
    }
  };

  /**
   * Scrolls to the selected Element in the ifc Tree.
   */
  controlsTreeScrollToSelected = function()
  {
	  var list = $('#object-tabs');
	  var offset = list.find('.controls-tree-selected').offset();
	  if(offset != null)
	  {
		  var optionTop = offset.top;
		  var selectTop = list.offset().top;
		  list.scrollTop(list.scrollTop() + (optionTop - selectTop));
	  }
  };
  
  /**
   * Reacts on Filter inputtext changed event.
   */
  filterChanged = function()
  {
	  $('#filtered-list').find('li').remove();  //clear last filter result
	  var inputtext = $('#filterinput').val().split(';');  //get tokens delimited by ';'
	  filterObjects(inputtext);
  }
  
  /**
   * Filters the Object tree according to the string in the input field.
   */
  filterObjects = function(inputtext)
  {
	  //add case-insensitive search functionally to jquery
	  $.extend($.expr[':'], {
		  'contains-case-insensitive': function(elem, i, match, array)
		  {
		    return (elem.textContent || elem.innerText || '').toLowerCase()
		    .indexOf((match[3] || "").toLowerCase()) >= 0;
		  }
		});
	  //iterate all filter patterns (delimited by ';')
	  for(var j=0; j<inputtext.length; j++)
	  {
		  var filtertext = inputtext[j];
		  var foundElements = $('div.controls-tree-item:contains-case-insensitive('+filtertext+')');
		  //iterate all found elements
		  for(var i=0; i<foundElements.length; i++)
		  {
			  var id = $(foundElements[i]).closest('.controls-tree-rel').attr('id');
			  var text = $(foundElements[i]).closest('.controls-tree-rel').text().split(")")[0] + ")";  //split ensures that only the first element (inclusive description in brackets) is listed
			  var html = "<li id='"+id+"' class='filtered-item controls-tree-item'>"+text+"</li>";
			  $('#filtered-list').append(html);
			  $('#filtered-list').find('#' + RegExp.escape(id)).click(function () {  //append filtered element to list and set click handler
				  var id = $(this).attr('id');
				  controlsTreeSelectObject(id);  //select Element in 3D Modell
				  $(this).addClass("controls-tree-selected");
			  });
		  }
	  }
  };
  

  controlsShowProperties = function(event) {
    if ((event != null) && event.target.nodeName === 'INPUT') return;
    ($('#controls-accordion')).accordion('activate', 1);
    return helpShortcutsHide('inspection');
  };
  
  /**
   * If doubleclick on an Object in Filter Tab, set View to this Object
   */
  controlsDoubleClickFilter = function(event) {
	  if ((event != null) && event.target.nodeName === 'INPUT') return;
	  return doSetViewToObject(event.target.id);
  };
  
  /**
   * If doubleclick on an Object in Overview Tab, set View to this Object
   */
  controlsDoubleClickOverview = function(event) {
	  if ((event != null) && event.target.nodeName === 'INPUT') return;
	  return doSetViewToObject($(event.target).parent().attr('id'));
  };

  controlsNavigateLink = function(event) {
    controlsPropertiesSelectObject((($(event.target)).attr('href')).slice(1));
    return false;
  };

  controlsToggleLayer = function(event) {
    var el, elements, tags;
    elements = ($('#controls-layers input:checked')).toArray();
    tags = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = elements.length; _i < _len; _i++) {
        el = elements[_i];
        _results.push(((($(el)).attr('id')).split(/^layer\-/))[1]);
      }
      return _results;
    })();
    return state.scene.set('tagMask', '^(' + (tags.join('|')) + ')$');
  };

  snapshotsPush = function(thumb) {
    var imgURI, node, thumbSize;
    if (!(state.scene != null)) return;
    if ($.browser.webkit) {
      state.scene.renderFrame({
        force: true
      });
    }
    thumbSize = constants.thumbnails.size;
    imgURI = canvasCaptureThumbnail(state.canvas, 512 * thumbSize[0] / thumbSize[1], 512, constants.thumbnails.scale * thumbSize[0], constants.thumbnails.scale * thumbSize[1]);
    node = state.scene.findNode('main-lookAt');
    state.snapshots.lookAts.push({
      eye: node.get('eye'),
      look: node.get('look'),
      up: node.get('up')
    });
    if (thumb) ($('#snapshots')).append("<div class='snapshot'><div class='snapshot-thumb'><a href='#' class='snapshot-delete'>x</a><img width='" + thumbSize[0] + "px' height='" + thumbSize[1] + "px' src='" + imgURI + "'></div></div>");
//    return ($('#snapshots')).append("<div class='snapshot'><div class='snapshot-thumb'><a href='#' class='snapshot-delete'>x</a><img width='" + thumbSize[0] + "px' height='" + thumbSize[1] + "px' src='" + imgURI + "'></div></div>");
    return 0;
  };
  
  /**
   * Calculates the Eye Position and the Look Position to get a View to the Point of interest
   * 
   * @param x	an Integer with the x Value of the first Vertex of an Object
   * @param y	an Integer with the y Value of the first Vertex of an Object
   * @param z	an Integer with the z Value of the first Vertex of an Object
   */
  snapshotsPushObject = function(x,y,z) {
	    var node, zoomAtNode;
	    if (!(state.scene != null)) return;
	    if ($.browser.webkit) {
	      state.scene.renderFrame({
	        force: true
	      });
	    }
	    
	    //get reference to main-lookAt node
	    node = state.scene.findNode('main-lookAt');
	    
	    var xView, yView, zView;

	    //from which side should be watched
	    if (state.propertyValues.boundfactor){
		    if (y < 0){
			    yView = y - 14 * 1/state.propertyValues.scalefactor;
		    }else{
			    yView = y + 14 * 1/state.propertyValues.scalefactor;
		    }
		    xView = x;
	    }else{
		    if (x < 0){
		    	xView = x - 14 * 1/state.propertyValues.scalefactor;
		    }else{
			    xView = x + 14 * 1/state.propertyValues.scalefactor;
		    }
		    yView = y;
	    }
	    zView = z + 5 * 1/state.propertyValues.scalefactor;

	    //Set new eye, look and up values
	    zoomAtNode = state.scene.findNode('main-lookAt');
	    zoomAtNode.set('eye', {x: xView, y: yView, z: zView});
	    zoomAtNode.set('look', {x: x, y: y, z: z});
	    zoomAtNode.set('up', state.lookAt.defaultParameters.up);
       
       //call snapshot move destination
	    state.snapshots.lookAts.push({
	        eye: zoomAtNode.get('eye'),
	        look: zoomAtNode.get('look'),
	        up: zoomAtNode.get('up')
	      });
	    
	    return 0;
	    //return ($('#snapshots')).append("<div class='snapshot'><div class='snapshot-thumb'><a href='#' class='snapshot-delete'>x</a><img width='" + thumbSize[0] + "px' height='" + thumbSize[1] + "px' src='" + imgURI + "'></div></div>");
	  };
	  
  snapshotsDelete = function(event) {
    var $parent;
    $parent = ($(event.target)).parent();
    state.snapshots.lookAts.splice($parent.index() + 1, 1);
    return $parent.remove();
  };

  snapshotsToggle = function(event) {
    if (!(state.scene != null)) {}
  };

  snapshotsPlay = function(event) {
    if (!(state.scene != null)) return;
    return (SceneJS.FX.TweenSpline(state.scene.findNode('main-lookAt'))).sequence(state.snapshots.lookAts);
  };
  
  
  //Fixes download of objects from BIM Server Repository
  /*
   * duckt-tape-fix by: 
   * DLabz 
   * designlabz@gmail.com 
   * veljko@sigidev.com  
   * * * * * * * * * * * * * * */
   bimserverImport = function(url, oid) {
    var downloadDone, getDownloadDataDone, pwd, user;
    if (typeof console !== "undefined" && console !== null) {
      if (typeof console.log === "function") {
        console.log("Load BIMserver project with revision # " + oid + "...");
      }
    }
    user = ($('#bimserver-login-username')).val();
    pwd = ($('#bimserver-login-password')).val();
    getDownloadDataDone = function(data, textStatus, jqXHR) {
      if (typeof console !== "undefined" && console !== null) {
        if (typeof console.log === "function") {
          console.log("...Download completed");
        }
      }
      try {
        loadScene($.parseJSON(data));
        helpStatusClear();
      } catch (error) {
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.log === "function") console.log(error);
        }
      }
    };
    downloadDone = function(data, textStatus, jqXHR) {
    	data = eval('(' + data + ')');
      if (typeof console !== "undefined" && console !== null) {
        if (typeof console.log === "function") {
          console.log("...Got download action id '" + data.laid + "'");
        }
      }
      if (typeof console !== "undefined" && console !== null) {
        if (typeof console.log === "function") {
          console.log("Fetch download data...");
        }
      }
      (($.ajax({
        username: encodeURIComponent(user),
        password: encodeURIComponent(pwd),
        type: 'GET',
        url: url + 'download?',//url: url + 'rest/getDownloadData',
        dataType: 'text',
        data: 'longActionId=' + data.laid + '&serializerName=SceneJS'
      })).done(getDownloadDataDone)).fail(function(jqXHR, textStatus, errorThrown) {
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.log === "function") console.log(textStatus);
        }
        return typeof console !== "undefined" && console !== null ? typeof console.log === "function" ? console.log("...BIMserver import failed") : void 0 : void 0;
      });
    };
    return (($.ajax({
      username: encodeURIComponent(user),
      password: encodeURIComponent(pwd),
      type: 'GET',
      url: url + 'initiatedownload.jsp',
      dataType: 'text',
      /* data={"roid":65,"downloadType":"single","serializerName":"SceneJS","sync":true} */
      data: 'data={"roid":' + oid + ',"downloadType":"single","serializerName":"SceneJS","sync":true}'
    })).done(downloadDone)).fail(function(jqXHR, textStatus, errorThrown) {
      if (typeof console !== "undefined" && console !== null) {
        if (typeof console.log === "function") console.log(textStatus);
      }
      return typeof console !== "undefined" && console !== null ? typeof console.log === "function" ? console.log("...BIMserver import failed") : void 0 : void 0;
    });
  };
  
 /* end fix */

  hideDialog = function() {
    return ($('#dialog-background,#dialog-bimserver-import,#dialog-file-import')).hide();
  };

  bimserverImportDialogClearMessages = function() {
    ($('#bimserver-import-message-info')).html('');
    ($('#bimserver-import-message-error')).html('');
    return ($('.error')).removeClass('error');
  };

  bimserverImportDialogShow = function() {
    bimserverImportDialogShowTab1();
    return ($('#dialog-background,#dialog-bimserver-import')).show();
  };

  bimserverImportDialogShowTab1 = function() {
    var $stepElements;
    bimserverImportDialogClearMessages();
    $stepElements = $('#dialog-bimserver-import .dialog-step');
    ($($stepElements.get(0))).addClass('dialog-step-active');
    ($($stepElements.get(1))).removeClass('dialog-step-active');
    ($('#dialog-tab-bimserver1')).show();
    return ($('#dialog-tab-bimserver2')).hide();
  };

  bimserverImportDialogShowTab2 = function() {
    var $stepElements;
    bimserverImportDialogClearMessages();
    $stepElements = $('#dialog-bimserver-import .dialog-step');
    ($($stepElements.get(0))).removeClass('dialog-step-active');
    ($($stepElements.get(1))).addClass('dialog-step-active');
    ($('#dialog-tab-bimserver1')).hide();
    return ($('#dialog-tab-bimserver2')).show();
  };

  bimserverImportDialogToggleTab2 = function() {
    return bimserverImportDialogShowTab2();
  };

  bimserverImportDialogLogin = function() {
    var pwd, url, user, valid;
    bimserverImportDialogClearMessages();
    ($('bimserver-projects')).html("");
    url = ($('#bimserver-login-url')).val();
    user = ($('#bimserver-login-username')).val();
    pwd = ($('#bimserver-login-password')).val();
    console.log("login");
    console.log("url: " + url);
    console.log("user: " + user);
    console.log("pwd: " + pwd);
    valid = true;
    if (url.length < 1) {
      ($('#bimserver-login-url')).addClass('error');
      valid = false;
    }
    if (user.length < 1) {
      ($('#bimserver-login-username')).addClass('error');
      valid = false;
    }
    if (pwd.length < 1) {
      ($('#bimserver-login-password')).addClass('error');
      valid = false;
    }
    if (!valid) {
      ($('#bimserver-import-message-error')).html("Some fields are incorrect");
      return false;
    }
    ($('#dialog-tab-bimserver1 input, #dialog-tab-bimserver1 button')).attr('disabled', 'disabled');
    if (url[url.length - 1] !== '/') url += '/';
    ($('#bimserver-import-message-info')).html("Sending login request...");

    ($.ajax({
      username: encodeURIComponent(user),
      password: encodeURIComponent(pwd),
      url: url + 'login.jsp',
      data: 'username=' + (encodeURIComponent(user)) + '&password=' + (encodeURIComponent(pwd)) + '&login=Login'// + '&origurl=' + encodeURIComponent('/bimserver/main.jsp')
    })).done(function(data, textStatus, jqXHR) {
      ($('#bimserver-import-message-info')).html("Login request succeeded");
      console.log("hallo request success");
      bimserverImportDialogShowTab2();
      return bimserverImportDialogRefresh();
    }).fail(function(jqXHR, textStatus, errorThrown) {
      ($('#bimserver-import-message-info')).html("");
      return ($('#bimserver-import-message-error')).html("Login request failed");
    }).always(function(jqXHR, textStatus, errorThrown) {
      return ($('#dialog-tab-bimserver1 input, #dialog-tab-bimserver1 button')).removeAttr('disabled');
    })
    pwd = null;
    return true;
  };
  

  bimserverImportDialogRefresh = function() {
    var $projectList, url;
    url = ($('#bimserver-login-url')).val();
    if (url[url.length - 1] !== '/') url += '/';
    ($('#dialog-tab-bimserver2 button')).attr('disabled', 'disabled');
    ($('#bimserver-projects-submit')).attr('disabled', 'disabled');
    $projectList = $('#bimserver-projects');
    $projectList.html("");
    return ($.get(url + 'rest/getAllProjects', void 0, void 0, 'xml')).done(function(data, textStatus, jqXHR) {
      ($('#bimserver-import-message-info')).html("Fetched all projects");
      return (($(data)).find('sProject')).each(function() {
        return $projectList.append("<li class='bimserver-project' bimserveroid='" + (($(this)).find('oid')).text() + "' bimserverroid='" + (($(this)).find('revisions')).text() + "'>" + (($(this)).find('name')).text() + "</li>");
      });
    }).fail(function(jqXHR, textStatus, errorThrown) {
      ($('#bimserver-import-message-info')).html('');
      return ($('#bimserver-import-message-error')).html("Couldn't fetch projects");
    }).always(function(jqXHR, textStatus, errorThrown) {
      return ($('#dialog-tab-bimserver2 button')).removeAttr('disabled');
    });
  };

  bimserverImportDialogSelect = function(event) {
    ($('.bimserver-project-selected')).removeClass('bimserver-project-selected');
    ($(event.target)).addClass('bimserver-project-selected');
    return ($('#bimserver-projects-submit')).removeAttr('disabled');
  };

  bimserverImportDialogLoad = function() {
    var $selectedProject, url;
    $selectedProject = $('.bimserver-project-selected');
    if ($selectedProject.length === 0) {
      return ($('#bimserver-import-message-error')).html("No project selected");
    } else {
      hideDialog();
      url = ($('#bimserver-login-url')).val();
      if (url[url.length - 1] !== '/') url += '/';
      return bimserverImport(url, $selectedProject.attr('bimserverroid'));
    }
  };

  fileImportDialogShow = function(event) {
    return ($('#dialog-background,#dialog-file-import')).show();
  };

  fileImportDialogLoad = function(event) {
    var file, reader, _ref;
    reader = new FileReader();
    reader.onloadend = function(f) {
      try {
        loadScene($.parseJSON(f.target.result));
        return helpStatusClear();
      } catch (error) {
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.log === "function") console.log(error);
        }
      }
    };
    file = (_ref = ($('#upload-file')).get(0)) != null ? _ref.files[0] : void 0;
    if (file != null) {
      reader.readAsText(file);
      return hideDialog();
    } else {
      ($('#file-import-message-error')).html("No file selected");
      return typeof console !== "undefined" && console !== null ? typeof console.log === "function" ? console.log("No file selected") : void 0 : void 0;
    }
  };

  registerDOMEvents = function() {
	($(state.viewport.domElement)).mousedown(mouseDown);
    ($(state.viewport.domElement)).mouseup(mouseUp);
    ($(state.viewport.domElement)).mousemove(mouseMove);
    state.viewport.domElement.addEventListener('mousewheel', mouseWheel, false);
    state.viewport.domElement.addEventListener('DOMMouseScroll', mouseWheel, false);
    
    document.addEventListener('keydown', keyDown, false);
    return window.addEventListener('resize', windowResize, false);
  };
  
  registerControlEvents = function() {
    ($('#upload-form')).submit(fileImportDialogLoad);
    ($('.dialog-close')).click(hideDialog);
    ($('#dialog-tab-bimserver1')).submit(bimserverImportDialogLogin);
    ($('#dialog-tab-bimserver2')).submit(bimserverImportDialogLoad);
    ($('#bimserver-import-step1')).click(bimserverImportDialogShowTab1);
    ($('#bimserver-import-step2')).click(bimserverImportDialogToggleTab2);
    ($('#bimserver-projects-refresh')).click(bimserverImportDialogRefresh);
    ($('#bimserver-projects')).delegate('li', 'click', bimserverImportDialogSelect);
    ($('#top-menu-import-bimserver')).click(topmenuImportBimserver);
    ($('#top-menu-import-scenejs')).click(topmenuImportSceneJS);
    ($('#top-menu-performance-quality')).click(topmenuPerformanceQuality);
    ($('#top-menu-performance-performance')).click(topmenuPerformancePerformance);
    ($('#top-menu-mode-basic')).click(topmenuModeBasic);
    ($('#top-menu-mode-advanced')).click(topmenuModeAdvanced);
    ($('#top-menu-help')).click(topmenuHelp);
    ($('#main-views-reset')).click(mainmenuViewsReset);
    ($('#main-views-front')).click(mainmenuViewsFront);
    ($('#main-views-side')).click(mainmenuViewsSide);
    ($('#main-views-top')).click(mainmenuViewsTop);
    ($('#expose')).slider({
    	   slide: function(event, ui) {
    		   window.setExposeLevel(ui.value);
    	   }
    });
    ($('#transparent')).slider({
 	   slide: function(event, ui) {
		   window.setTransparentLevel(100-ui.value);
	   }
    });	
    ($('#toggle-Pan-Rotate')).click(togglePanRotate);
    ($('#controls-relationships')).delegate('.controls-tree-item', 'click', controlsToggleTreeOpen);
    ($('#controls-relationships')).delegate('.controls-tree-item', 'dblclick', controlsDoubleClickOverview);
    ($('#filtered-list')).delegate('.controls-tree-item', 'dblclick', controlsDoubleClickFilter);
    ($('#controls-relationships')).delegate('input', 'change', controlsToggleTreeVisibility);
    ($('#controls-layers')).delegate('input', 'change', controlsToggleLayer);
    ($('#snapshot-placeholder')).click(function () {
    	(snapshotsPush(true));
    });
    ($('#snapshots')).delegate('.snapshot', 'click', snapshotsToggle);
    ($('#snapshots')).delegate('.snapshot-delete', 'click', snapshotsDelete);
    ($('#snapshots-play')).click(snapshotsPlay);
    return ($(state.viewport.domElement)).dblclick(controlsShowProperties);
  };

  canvasInit = function() {
    return windowResize();
  };

  sceneInit = function() {
    var lookAtNode, sceneDiameter, tag, tags;
    modifySubAttr(state.scene.findNode('main-camera'), 'optics', 'aspect', state.canvas.width / state.canvas.height);
    sceneDiameter = SceneJS_math_lenVec3(state.scene.data().bounds);
    console.log("SceneDiameter: " + sceneDiameter);  //TODO: remove log?
    state.camera.distanceLimits = [sceneDiameter * 0.1, sceneDiameter * 2.0];
    tags = (function() {
      var _i, _len, _ref, _results;
      _ref = state.scene.data().ifcTypes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tag = _ref[_i];
        _results.push(tag.toLowerCase());
      }
      return _results;
    })();
    state.scene.set('tagMask', '^(' + (tags.join('|')) + ')$');
    lookAtNode = state.scene.findNode('main-lookAt');
    state.lookAt.defaultParameters.eye = lookAtNode.get('eye');
    state.lookAt.defaultParameters.look = lookAtNode.get('look');
    return state.lookAt.defaultParameters.up = lookAtNode.get('up');
  };

  
  controlsInit = function() {
    var ifcType, layersHtml, sceneData;
    sceneData = state.scene.data();
    layersHtml = (function() {
      var _i, _len, _ref, _results;
      _ref = sceneData.ifcTypes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ifcType = _ref[_i];
        _results.push("<div><input id='layer-" + ifcType.toLowerCase() + "' type='checkbox' checked='checked'> " + ifcType + "</div>");
      }
      return _results;
    })();
    ($('#controls-layers')).html(layersHtml.join(''));
    controlsPropertiesSelectObject();
    ($('#controls-accordion')).accordion({
      header: 'h3'
    });
    ($('#object-tabs')).tabs();
    ($('#filterinput')).val("");
    ($('#filterinput')).change(filterChanged);

    return ($('#main-view-controls')).removeAttr('style');
  };

  viewportInit = function() {
    return $('#scenejsCanvas').toggleClass('bimsurfer-empty-watermark', !(state.scene != null));
  };

  //initialize the ifc object tree
  ifcTreeInit = function() {
    var ifcContains, ifcDecomposedBy, ifcDefinedBy, ifcObjectDescription, ifcProject, ifcRelationships, project, sceneData, treeHtml, _i, _len, _ref;
    sceneData = state.scene.data();
    
    //initialize the Objects Tab
    ifcObjectDescription = function(obj, indent) {
    	  return "<li class='controls-tree-rel' id='" + obj.id + "'><div class='controls-tree-item'><span class='indent-" + String(indent) + "'/>" + "<input type='checkbox' checked='checked'> " + obj.name + "<span class='controls-tree-postfix'>(" + obj.type + ")</span></div>" + (ifcDefinedBy(obj.decomposedBy, indent)) + (ifcDefinedBy(obj.definedBy, indent)) + (ifcContains(obj.contains, indent)) + "</li>";
    };
    ifcProject = function(obj) {
      return "<li class='controls-tree-root' id='" + obj.id + "'><div class='controls-tree-item'>" + obj.name + "<span class='controls-tree-postfix'>(" + obj.type + ")</span></div>" + (ifcDefinedBy(obj.decomposedBy, 0)) + (ifcDefinedBy(obj.definedBy, 0)) + (ifcContains(obj.contains, 0)) + "</li>";
    };
    ifcRelationships = function(type, rel, indent) {
      var html, obj, _i, _len;
      if ((rel != null) && rel.length > 0) {
        indent = Math.min(indent + 1, 6);
        html = "<ul class='controls-tree'>";
        html += "<div class='controls-tree-heading'><hr><h4>" + type + "</h4></div>";
        for (_i = 0, _len = rel.length; _i < _len; _i++) {
          obj = rel[_i];
        html += ifcObjectDescription(obj, indent);
        }
        return html += "</ul>";
      } else {
        return "";
      }
    };
    ifcDecomposedBy = function(rel, indent) {
      return ifcRelationships('Decomposed By', rel, indent);
    };
    ifcDefinedBy = function(rel, indent) {
      return ifcRelationships('Defined By', rel, indent);
    };
    ifcContains = function(rel, indent) {
      return ifcRelationships('Contains', rel, indent);
    };
    treeHtml = "<ul class='controls-tree'>";
    _ref = sceneData.relationships;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      project = _ref[_i];
      var name = project.name;
      console.log("obj.name: " + project.name);
      console.log("obj.type: " + project.type);
      treeHtml += ifcProject(project); 	
    }
	treeHtml += "</ul>";
    return ($('#controls-relationships')).html(treeHtml);
  };

  canvasInit();

  if (state.scene != null) {
    sceneInit();
    state.scene.start({
      idleFunc: SceneJS.FX.idle
    });
  }

  parseQueryArguments = function() {
    var arg, argKeyVal, args, argsParts, part, _i, _len;
    args = {};
    argsParts = (document.location.search.substring(1)).split('&');
    for (_i = 0, _len = argsParts.length; _i < _len; _i++) {
      part = argsParts[_i];
      arg = unescape(part);
      if ((arg.indexOf('=')) === -1) {
        args[arg.trim()] = true;
      } else {
        argKeyVal = arg.split('=');
        args[argKeyVal[0].trim()] = argKeyVal[1].trim();
      }
    }
    if ((args.model != null) && (args.model.substr(-1)) === '/') {
      args.model = args.model.substr(0, args.model.length - 1);
    }
    return args;
  };

  initLoadModel = function(modelUrl) {
    ($.get(modelUrl, void 0, void 0, 'json')).done(function(data, textStatus, jqXHR) {
      try {
        return loadScene(data);
      } catch (error) {
        return typeof console !== "undefined" && console !== null ? typeof console.log === "function" ? console.log(error) : void 0 : void 0;
      }
    }).fail(function(jqXHR, textStatus, errorThrown) {
      if (typeof console !== "undefined" && console !== null) {
        if (typeof console.log === "function") console.log(textStatus);
      }
    });
  };

  $(function() {
    state.queryArgs = parseQueryArguments();
    viewportInit();
    if (state.scene != null) {
      controlsInit();
      ifcTreeInit();
      helpShortcuts('standard', 'navigation');
    } else {
      helpStatus("Please load a project from the <strong>File</strong> menu in the top left-hand corner.");
      helpShortcuts('standard');
    }
    registerDOMEvents();
    registerControlEvents();
    state.application.initialized = true;
    console.log(state.queryArgs);
    if ((state.queryArgs.model != null) && state.queryArgs.format === 'scenejson') {
      return initLoadModel(state.queryArgs.model);
    }
  });

  loadScene = function(scene) {
    if (state.scene != null) {
      state.scene.destroy();
      state.scene = null;
    }
    try {
      if (typeof console !== "undefined" && console !== null) {
        if (typeof console.log === "function") console.log('Create scene...');
      }
      SceneJS.createScene(scene);
      state.scene = SceneJS.scene('Scene');
      viewportInit();
      if (state.scene != null) {
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.log === "function") {
            console.log('Initialize scene...');
          }
        }
        sceneInit();
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.log === "function") console.log('Start scene...');
        }
        state.scene.start({
          idleFunc: SceneJS.FX.idle
        });
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.log === "function") {
            console.log('Initialize controls...');
          }
        }
        controlsInit();
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.log === "function") {
            console.log('Initialize IFC object tree...');
          }
        }
        ifcTreeInit();
        helpShortcuts('standard', 'navigation');
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.log === "function") console.log('...Done');
        }
        
		//Calculate Scalefactor
		var ref, len, i, unit, sizingFactor;
		
		unit = state.scene.data().unit;
		console.log("Unit: " + unit);
		ref = state.scene.data().bounds;
		for (i = 0, len = ref.length; i < len; i++) {  //iterate all bounds
			console.log("Bound" + i + ": " + ref[i]);
		}
		//to decide which side is used to set view in setViewToObject
		if (ref[0] > ref[1]){
			state.propertyValues.boundfactor = 1;			//for setView to decide the main viewside
		}
		state.propertyValues.scalefactor = parseFloat(unit);	
		
		//setting viewfactor for different views
		state.propertyValues.viewfactor = SceneJS_math_lenVec3(state.scene.data().bounds);
		
		//set Navigation Mode to rotate
		window.setNavigationMode(0);
		
	    //highlight all elements with specified name
	    highlightElements("dp_");
		
        return state.scene;
      }
    } catch (error) {
      if (typeof console !== "undefined" && console !== null) {
        if (typeof console.log === "function") console.log(error);
      }
      if (typeof console !== "undefined" && console !== null) {
        if (typeof console.log === "function") console.log('...Errors occured');
      }
    }
    helpShortcuts('standard');
    return null;
  };

}).call(this);
