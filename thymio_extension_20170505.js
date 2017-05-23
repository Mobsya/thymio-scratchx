/*
v 1.0
*/

(function(ext) {

	var ASEBAHTTPURL='http://localhost:3000/';
	var VMAX=500;
	var VMIN=-500;
	var DEBUG=true;
	var LMAX=32;
	var LMIN=0;
	
	var source = null;
	var connected = 0;
	var eventCompleteCallback = false;
	var cachedValues = Array();
	var leds=[0,0,0];
	connect();
	
	// Cleanup function when the extension is unloaded
    ext._shutdown = function() {
    	if(DEBUG){
			console.log("SHUTDOWN");
		}	
		
    	var args=Array();
    	sendAction('Q_reset',args,function(){
    		cachedValues = Array();
    		disconnect();
    		
    	});
    	
    };
    
     ext.resetAll = function() {
      console.log("resetAll");
	//TODO dial
	//TODO Leds
	//TODO motors
			//leds ?
			
			var args=Array();
    		sendAction('Q_reset',args,function(){
    			cachedValues = Array();
    			
    		
    		});
    };
    
    ext.poll = function() {
      console.log("poll");
	//ScratchX do not call poll
    };

		
	// Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function() {
        if(connected==0) return {status: 1, msg: 'Thymio disconnected'};
        if(connected==1) return {status: 1, msg: 'Probing for Thymio'};
        return {status: 2, msg: 'Ready'};
		};
		
	
	
	function connect(){
		
		connected=1;
		if(source) {
			source.close();
			source = null;
		}
	
		source = new EventSource(ASEBAHTTPURL+'nodes/thymio-II/events');//EventSource();//, {withCredentials: true}
		
		source.addEventListener('open', function(e){
			
			console.log("open");
			
		});
		
		source.addEventListener('message', function(e){
				
			eventData = e.data.split(" ");
			
			if(eventData[0]=="R_state_update"){
      			cachedValues=eventData;
      		//	console.log("cached "+cachedValues);
      			connected=2;
      		}else{
      			console.log("emitted "+eventData)
      			connected=1;
      		}
      		
      		
			
			//TODO manage errors
			// If block requires to check event message for completion, it will set eventCompleteCallback
			if(typeof eventCompleteCallback == 'function'){
				// We pass eventData to be able to read event message
				eventCompleteCallback(eventData);
			}
				
		});
		
		source.addEventListener('error', function(e){
			
			disconnect('Event stream closed');
			connect();
			
		});

		

	}
	
	function disconnect(reason){

		if(source) {
			source.close();
			source = null;
		}
		connected=0;
	}

	function stopExecution(){
		connected=1;
	}

	function requestSend(args,method,callback){
			
			switch(method){
				case 1:
					method = 'GET';
					break;
				case 2:
					method = 'POST';
					break;
				case 3:
					method = 'PUT';
					break;
				default:
					method = 'GET';
					break;
			}
			
			// First argument is node name
			url = ASEBAHTTPURL+'nodes/thymio-II/' + args[0];
			
			var req = new XMLHttpRequest();
			if(!req) {
				return;
			}
			req.open(method, url, true);
			req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
			req.onreadystatechange = function () {
				if(req.readyState != 4) {
					return;
				}
				callback(req);
			};
			if(req.readyState == 4) {
      	 		return;
			}
			
			
			quid = 3;
			payload = '';
			payload += '&body[]=' + quid;
			payload += '&body[]=' + args[1];
			payload += '&body[]=' + args[2];
			payload += '&body[]=' + args[3];
			
			// Send http request
			req.send('[' + quid + ',' + parseInt(args[1]) + ',' + parseInt(args[2]) + ',' + parseInt(args[3]) + ']');
			
			//jsonArgs = JSON.stringify([quid,args[1],args[2],args[3]]);
			//req.send(jsonArgs = JSON.stringify([quid,args[1],args[2],args[3]]));
			
		};
	
	ext.reset=function(){
		if(DEBUG){
			console.log("reset");
		}	
		
		var args=Array();
    	sendAction('Q_reset',args,function(){
    		cachedValues = Array();
    		disconnect("Reset");
    		connect();
    	});
	}
	
	ext.scratch_move = function(distance,callback){
      
      if(DEBUG){
			console.log("call scratch_move "+distance);
	  }
		
      // Construct args to send with request
      var mm = parseInt(distance);
      if(mm==0){
      		var args = Array();
      		args.push(100*32/10); //speed=10mm/s
			sendAction('M_motor_left',args,function(){
				sendAction('M_motor_right',args,callback);
			});
      		 
      }else{
      var speed;
      if(Math.abs(mm) < 20){
      	speed = 20;
      } else {
      	if(Math.abs(mm) > 150){
      		speed = 150;
      	} else {
      		speed = Math.abs(mm);
      	}
      }
      var time = Math.abs(mm) * 100 / speed; // time measured in 100 Hz ticks
      speed = speed * 32 / 10;
      var args = Array();
      
      args.push("Q_add_motion");
      args.push(time);
      if(mm > 0){
      	args.push(speed);
      	args.push(speed);
      } else {
      	args.push(speed*-1);
      	args.push(speed*-1);
      }
      
      // Send request
      requestSend(args,2,
      	function(resp){
      	
      
      	
      	if(DEBUG){
			console.log("sent scratch_move "+distance);
	    }
	  
      	// Set message to look for in event "message" and execute callback (next block) when received
      	eventCompleteCallback = function(eventData){
      		
      		if(eventData[0].match(/^Q_motion_noneleft/)){
      			if(DEBUG){
					console.log(eventData[0] +"=> call callback ");
	    		}
      			console.log(eventData[0]);
      			callback();
      		};
      	};
      	
      });
      }
	};
		
	ext.scratch_move_with_speed = function(distance,speed,callback){
      
      if(DEBUG){
			console.log("call scratch_move_with_speed "+distance);
	  }
		
      // Construct args to send with request
      var mm = parseInt(distance);
      var speed = parseInt(Math.abs(speed));
      speed=parseInt(clamp(speed,VMIN*10/32,VMAX*10/32));
      
      if(mm==0){
      		var args = Array();
      		args.push(speed*32/10); //speed=10mm/s
			sendAction('M_motor_left',args,function(){
				sendAction('M_motor_right',args,callback);
			});
      		 
      }else{
      var time = Math.abs(mm) * 100 / speed; // time measured in 100 Hz ticks
      speed = speed * 32 / 10;
      var args = Array();
      
      args.push("Q_add_motion");
      args.push(time);
      if(mm > 0){
      	args.push(speed);
      	args.push(speed);
      } else {
      	args.push(speed*-1);
      	args.push(speed*-1);
      }
      
      // Send request
      requestSend(args,2,function(resp){
      	
      
      	
      	if(DEBUG){
			console.log("sent scratch_move_with_speed "+distance);
	    }
	  
      	// Set message to look for in event "message" and execute callback (next block) when received
      	eventCompleteCallback = function(eventData){
      		
      		if(eventData[0].match(/^Q_motion_noneleft/)){
      			if(DEBUG){
					console.log(eventData[0] +"=> call callback ");
	    		}
      			console.log(eventData[0]);
      			callback();
      		};
      	};
      	
      });
      }
	};
		
	ext.scratch_move_with_time = function(distance,time,callback){
      
      if(DEBUG){
			console.log("call scratch_move_with_speed "+distance);
	  }
		
      // Construct args to send with request
      var mm = parseInt(distance);
  	  var time = parseInt(Math.abs(time));
      var speed= parseInt(Math.abs(mm)/time);
      speed=parseInt(clamp(speed,VMIN*10/32,VMAX*10/32));
      
      var time = time * 100; // time measured in 100 Hz ticks
      speed = speed * 32 / 10;
      var args = Array();
      
      args.push("Q_add_motion");
      args.push(time);
      if(mm > 0){
      	args.push(speed);
      	args.push(speed);
      } else {
      	args.push(speed*-1);
      	args.push(speed*-1);
      }
      
      // Send request
      requestSend(args,2,function(resp){
      	
      
      	
      	if(DEBUG){
			console.log("sent scratch_move_with_speed "+distance);
	    }
	  
      	// Set message to look for in event "message" and execute callback (next block) when received
      	eventCompleteCallback = function(eventData){
      		
      		if(eventData[0].match(/^Q_motion_noneleft/)){
      			if(DEBUG){
					console.log(eventData[0] +"=> call callback ");
	    		}
      			console.log(eventData[0]);
      			callback();
      		};
      	};
      	
      });
      
	};
	
	ext.scratch_stop = function(){
		if(DEBUG){
			console.log("scratch_stop");
		}
		var args = Array();
		args.push(0);
		sendAction('M_motor_left',args,function(){
			sendAction('M_motor_right',args);
		});
		
    };
    
    ext.scratch_arc = function(radius,degrees,callback){
		if(DEBUG){
			console.log("scratch_arc "+degrees+" "+radius);
		}	
	degrees = parseInt(degrees);
	radius = parseInt(radius);
	
	if (Math.abs(radius) < 100)
		radius = (radius < 0) ? -100 : 100; // although actually, we should just call scratch_turn
    
    var ratio = (Math.abs(radius)-95) * 10000 / Math.abs(radius);
    var time = (degrees * (50.36 * radius + 25)) / 3600;
    
    var v_out = 400;
    var v_in = v_out * ratio / 10000;
    
    if (radius < 0){
     
     	v_in = -v_in;
     	v_out = -v_out;
	}
      
      var args = Array();
      args.push("Q_add_motion");
	  args.push(time);
      args.push((degrees > 0) ? v_out : v_in );
      args.push((degrees > 0) ? v_in  : v_out);
     
      
      // Send request
      requestSend(args,2,function(resp){
      	
      	if(DEBUG){
			console.log("sent scratch_arc "+degrees+" "+radius);
	    }
	    
      	
      	// Set message to look for in event "message" and execute callback (next block) when received
      	eventCompleteCallback = function(eventData){
      		if(eventData[0].match(/^Q_motion_noneleft/)){
      			if(DEBUG){
					console.log(eventData[0] +"=> call callback ");
	    		}
      			callback();
      		};
      	};
      	
      });
      
      
	};
    
    ext.scratch_turn = function(degrees,callback){
	  if(DEBUG){
			console.log("scratch_turn "+degrees);
	  }
		
	  degrees = parseInt(degrees);
      var speed, time;
      if (Math.abs(degrees) > 90)
      {
          speed = 65 * 32/10;
          time = Math.abs(degrees) * 1.3;
      }
      else
      {
          speed = 43 * 32/10;
          time = Math.abs(degrees) * 2.0;
          time = degrees*degrees * 2.0 / (Math.abs(degrees)*1.016 - 0.52); // nonlinear correction
      }
      var args = Array();
      args.push("Q_add_motion");
	  args.push(time);
      args.push((degrees > 0) ?  speed : speed*-1 );
      args.push((degrees > 0) ? speed*-1 :  speed );
     
      
      // Send request
      requestSend(args,2,function(resp){
      	
      	if(DEBUG){
			console.log("sent scratch_turn "+degrees);
	    }
      	
      	// Set message to look for in event "message" and execute callback (next block) when received
      	eventCompleteCallback = function(eventData){
      		if(eventData[0].match(/^Q_motion_noneleft/)){
      			if(DEBUG){
					console.log(eventData[0] +"=> call callback ");
	    		}
      			callback();
      		};
      	};
      	
      });
      
	};
	
	ext.scratch_turn_with_speed = function(degrees,speed,callback){
	  if(DEBUG){
			console.log("scratch_turn_with_speed "+degrees);
	  }
		
	  degrees = parseInt(degrees);
	  speed= Math.abs(speed);
     
      var time;
      if (Math.abs(degrees) > 90)
      {
          speed = 65 * 32/10;
          time = Math.abs(degrees) * 1.3;
      }
      else
      {
          speed = 43 * 32/10;
          time = Math.abs(degrees) * 2.0;
          time = degrees*degrees * 2.0 / (Math.abs(degrees)*1.016 - 0.52); // nonlinear correction
      }
      
      var args = Array();
      args.push("Q_add_motion");
	  args.push(time);
      args.push((degrees > 0) ?  speed : speed*-1 );
      args.push((degrees > 0) ? speed*-1 :  speed );

      
      // Send request
      requestSend(args,2,function(resp){
      	
      	if(DEBUG){
			console.log("sent scratch_turn "+degrees);
	    }
      	
      	// Set message to look for in event "message" and execute callback (next block) when received
      	eventCompleteCallback = function(eventData){
      		if(eventData[0].match(/^Q_motion_noneleft/)){
      			if(DEBUG){
					console.log(eventData[0] +"=> call callback ");
	    		}
      			callback();
      		};
      	};
      	
      });
      
	};
	
    ext.scratch_motor = function(motor,value){
		
		value = parseInt(clamp(value,VMIN,VMAX));
		if(DEBUG){
			console.log("call scratch_motor "+value);
		}
		var args = Array();
		args.push(value);
		if(motor==menus[lang]['leftrightall'][0]){
			sendAction('M_motor_left',args);
		}else if(motor==menus[lang]['leftrightall'][1]){
			sendAction('M_motor_right',args);
		}else{
			sendAction('M_motor_left',args,function(){
				sendAction('M_motor_right',args);
			});
			
		}
	
        
    };

	ext.ground = function(sensor){
		
		if(DEBUG){
			console.log("call ground "+sensor);
		}
		
		return parseInt(cachedValues[15+parseInt(sensor)]);
    
	};
	
	ext.proximity = function(sensor){
		
		if(DEBUG){
			console.log("call proximity "+sensor);
		}
	
	 	return parseInt(cachedValues[17+parseInt(sensor)]); 
    
	};

	ext.scratch_leds = function(led,r,g,b){
			
		if(DEBUG){
			console.log("call scratch_leds "+led+" "+r+" "+g+" "+b);
		}
		
		var args = Array();
		args.push(parseInt(clamp(r,LMIN,LMAX)));
		args.push(parseInt(clamp(g,LMIN,LMAX)));
		args.push(parseInt(clamp(b,LMIN,LMAX)));
		
		if(led==menus[lang]['light'][0]){
		
			sendAction('V_leds_top',args);
			args.unshift(0);
			sendAction('V_leds_bottom',args);
			args[0]=1;
			sendAction('V_leds_bottom',args);
			
		}else if(led==menus[lang]['light'][1]){
		
			sendAction('V_leds_top',args);
		
		}else if(led==menus[lang]['light'][2]){
		
			args.unshift(0);
			sendAction('V_leds_bottom',args);
			args[0]=1;
			sendAction('V_leds_bottom',args);
		
		}else if(led==menus[lang]['light'][3]){
		
			args.unshift(0);
			sendAction('V_leds_bottom',args);
		
		}else if(led==menus[lang]['light'][4]){
		
			args.unshift(1);
			sendAction('V_leds_bottom',args);
		
		}
   		
        
    };
  
     ext.scratch_change_leds = function(color,led){
			
		if(DEBUG){
			console.log("call scratch_change_leds "+color+" "+led);
		}
		
		
        var mask;
        if (led==menus[lang]['light'][0]) //ALL
        	mask = 7;
        else if (led==menus[lang]['light'][1]) //TOP
            mask = 1;
        else if (led==menus[lang]['light'][2]) //BOTTOM
            mask = 6;
        else if (led==menus[lang]['light'][3]) //BOTTOM Left
            mask = 2;
        else if (led==menus[lang]['light'][4]) //BOTTOM Right
            mask = 4;
        else
        	mask = 7;
        
        console.log(mask);
        
        if (mask == 1){
        	 
        	var rgb = makeLedsRGBVector((parseInt(color+leds[0]) % 198));
            sendAction('V_leds_top',rgb,function(){
        		leds[0]=color+leds[0];
        	});
        }else if(mask == 2){
        	var rgb = makeLedsRGBVector((parseInt(color+leds[1]) % 198));
        	rgb.unshift(0);
			sendAction('V_leds_bottom',rgb,function(){
        		leds[1]=color+leds[1];
        	});
        }else if(mask == 4){
        	var rgb = makeLedsRGBVector((parseInt(color+leds[2]) % 198));
        	rgb.unshift(1);
			sendAction('V_leds_bottom',rgb,function(){
        		leds[2]=color+leds[2];
        	});
        }else if(mask == 6){
        	var rgb = makeLedsRGBVector((parseInt(color+leds[1]) % 198));
        	rgb.unshift(0);
			sendAction('V_leds_bottom',rgb,function(){
        		leds[1]=color+leds[1];
        		rgb = makeLedsRGBVector((parseInt(color+leds[2]) % 198));
        		rgb.unshift(1);
        		sendAction('V_leds_bottom',rgb,function(){
        			leds[2]=color+leds[2];
        		});
        	});
        }else{
        	var rgb = makeLedsRGBVector((parseInt(color+leds[0]) % 198));
        	sendAction('V_leds_top',rgb,function(){
        		leds[0]=color+leds[0];
        		rgb = makeLedsRGBVector((parseInt(color+leds[1]) % 198));
        		rgb.unshift(0);
				sendAction('V_leds_bottom',rgb,function(){
					leds[1]=color+leds[1];
					rgb = makeLedsRGBVector((parseInt(color+leds[2]) % 198));
					rgb.unshift(1);
					sendAction('V_leds_bottom',rgb,function(){
        				leds[2]=color+leds[2];
        			});
        		});
        	});
        
        }
           
    };                
                    
    ext.scratch_set_leds = function(color,led){
			
		if(DEBUG){
			console.log("call scratch_set_leds "+color+" "+led);
		}
		
		color = parseInt(color) % 198;
        var mask;
        if (led==menus[lang]['light'][0]) //ALL
        	mask = 7;
        else if (led==menus[lang]['light'][1]) //TOP
            mask = 1;
        else if (led==menus[lang]['light'][2]) //BOTTOM
            mask = 6;
        else if (led==menus[lang]['light'][3]) //BOTTOM Left
            mask = 2;
        else if (led==menus[lang]['light'][4]) //BOTTOM Right
            mask = 4;
        else
        	mask = 7;
        
        console.log(mask);
        
        var rgb = makeLedsRGBVector(color); // by default, "V_leds_top"
        console.log(rgb);
        if (mask == 1){
        	sendAction('V_leds_top',rgb,function(){
        		leds[0]=color;
        	});
        }else if(mask == 2){
        	rgb.unshift(0);
			sendAction('V_leds_bottom',rgb,function(){
        		leds[1]=color;
        	});
        }else if(mask == 4){
        	rgb.unshift(1);
			sendAction('V_leds_bottom',rgb,function(){
        		leds[2]=color;
        	});
        }else if(mask == 6){
        	rgb.unshift(0);
			sendAction('V_leds_bottom',rgb,function(){
        		leds[1]=color;
        		rgb[0]=1;
        		sendAction('V_leds_bottom',rgb,function(){
        			leds[2]=color;
        		});
        	});
        }else{
        	sendAction('V_leds_top',rgb,function(){
        		leds[0]=color;
        		rgb.unshift(0);
				sendAction('V_leds_bottom',rgb,function(){
        			leds[1]=color;
        			rgb[0]=1;
					sendAction('V_leds_bottom',rgb,function(){
        				leds[2]=color;
        			});
        		});
        	});
        
        }
           
    }; 
    
    ext.scratch_leds= function(led,r,g,b){
			
		if(DEBUG){
			console.log("call scratch_leds "+led+" "+r+" "+g+" "+b);
		}
		
		var args = Array();
		args.push(parseInt(clamp(r,LMIN,LMAX)));
		args.push(parseInt(clamp(g,LMIN,LMAX)));
		args.push(parseInt(clamp(b,LMIN,LMAX)));
		
		if(led==menus[lang]['light'][0]){
		
			sendAction('V_leds_top',args);
			args.unshift(0);
			sendAction('V_leds_bottom',args);
			args[0]=1;
			sendAction('V_leds_bottom',args);
			
		}else if(led==menus[lang]['light'][1]){
		
			sendAction('V_leds_top',args);
		
		}else if(led==menus[lang]['light'][2]){
		
			args.unshift(0);
			sendAction('V_leds_bottom',args);
			args[0]=1;
			sendAction('V_leds_bottom',args);
		
		}else if(led==menus[lang]['light'][3]){
		
			args.unshift(0);
			sendAction('V_leds_bottom',args);
		
		}else if(led==menus[lang]['light'][4]){
		
			args.unshift(1);
			sendAction('V_leds_bottom',args);
		
		}
   		
        
    };
    
     ext.leds= function(led){
			
		if(DEBUG){
			console.log("call leds "+led);
		}
		
		if(led==menus[lang]['singlelight'][0]){
		
			return leds[0];
			
		}else if(led==menus[lang]['singlelight'][1]){
		
			return leds[1];
		
		}else if(led==menus[lang]['singlelight'][2]){
		
			return leds[2];
		
		}
    };
    
    ext.V_leds_circle = function(l0,l1,l2,l3,l4,l5,l6,l7){
		if(DEBUG){
			console.log("call scratch_leds "+l0+" "+l1+" "+l2+" "+l3+" "+l4+" "+l5+" "+l6+" "+l7);
		}
	
		var args = Array();
		args.push(parseInt(clamp(l0,LMIN,LMAX)));
		args.push(parseInt(clamp(l1,LMIN,LMAX)));
		args.push(parseInt(clamp(l2,LMIN,LMAX)));
		args.push(parseInt(clamp(l3,LMIN,LMAX)));
		args.push(parseInt(clamp(l4,LMIN,LMAX)));
		args.push(parseInt(clamp(l5,LMIN,LMAX)));
		args.push(parseInt(clamp(l6,LMIN,LMAX)));
		args.push(parseInt(clamp(l7,LMIN,LMAX)));
	
		sendAction('V_leds_circle',args);
    };
    
    ext.scratch_clear_leds = function(){
		if(DEBUG){
			console.log("call scratch_clear_leds");
		}
		
		var args = Array();
    	for(i=0;i<8;i++){
    		args.push(0);
   	 	}
	
   	 	sendAction('V_leds_circle',args,function(){
    
    		var args = Array();
    		for(i=0;i<3;i++){
    			args.push(0);
   	 		}
    		sendAction('V_leds_top',args,function(){
    			
    			var args = Array();
    			for(i=0;i<4;i++){
    				args.push(0);
   	 			}
   	 			
   	 			sendAction('V_leds_bottom',args,function(){
   	 				
   	 				var args = Array();
   	 				args.push(1);
    				for(i=0;i<3;i++){
    					args.push(0);
   	 				}
   	 				sendAction('V_leds_bottom',args,function(){
   	 					
   	 				});
   	 			});
    		});
    	});
    };
    
    ext.prox_ground_delta = function(){
    	if(DEBUG){
			console.log("prox_ground_delta");
		}
    	return cachedValues[15]+" "+cachedValues[16];
    
	};
	
	ext.prox_horizontal = function(){
		if(DEBUG){
			console.log("prox_horizontal");
		}
		
		var value=cachedValues[17];
		
		for(i=1;i<7;i++){
    		value=value+" "+cachedValues[(17+i)];
    	}
    	
    	return value;
	};
   
    ext.distance = function(sensor){
		if(DEBUG){
			console.log("distance "+sensor);
		}
	
		var num = parseInt(cachedValues[5]); 
		
		if(sensor==menus[lang]['sensors'][0]){
			var front = num & 0xff;
			return clamp(front,0,190);
		}else if(sensor==menus[lang]['sensors'][1]){
			var back = ((num >> 8) & 0xff);
			return clamp(back,0,125);
		}else{ 
			var ground=parseInt(cachedValues[15])+parseInt(cachedValues[16]);
			if(ground>1000)
				return 0;
			else return 500;
		}
		
	};
	
	ext.angle = function(sensor){
		
		if(DEBUG){
			console.log("angle "+sensor);
		}
		
		if(sensor==menus[lang]['sensors'][0]){
			return parseInt(cachedValues[4]); 
		}else{
			var num = parseInt(cachedValues[3]); 
			var back = (num % 256) - 90;
			var ground =  ((num >> 8) % 256) - 90;

			if(sensor==menus[lang]['sensors'][1])
				return back;
			else 
				return ground;
			
		}
    
	};
	
	ext.A_sound_freq = function(freq,time){
			
		if(DEBUG){
			console.log("A_sound_freq "+freq+" "+time);
		}
		
		freq = parseInt(freq);
		time = parseInt(parseFloat(time)*60);
	
		console.log("time "+time);
		var args = Array();
		args.push(parseInt(freq));
		args.push(parseInt(time));
		
		sendAction('A_sound_freq',args);
	
    };
    
    ext.A_sound_system = function(sound){
		if(DEBUG){
			console.log("A_sound_system "+sound);
		}
	
		sound = parseInt(sound);
		var args = Array();
		args.push(parseInt(sound));
		
		sendAction('A_sound_system',args);
	    
    };
   
   	ext.Q_set_odometer = function(theta,x,y){
		if(DEBUG){
			console.log("Q_set_odometer "+theta+" "+x+" "+y);
		}	
		var args = Array();
		args.push(parseInt(theta));
		args.push(parseInt(x));
		args.push(parseInt(y));
		
		sendAction('Q_set_odometer',args);
	};
    
    ext.odo = function(menu){
		if(DEBUG){
			console.log("odo "+menu);
		}
		if(menu==menus[lang]['odo'][0]){
			return parseInt(cachedValues[10]);
		}else if(menu==menus[lang]['odo'][1]){
			return parseInt(cachedValues[11]/28);
		}else if(menu==menus[lang]['odo'][2]){
			return parseInt(cachedValues[12]/28);
		}
	};
	
	ext.mic_intensity=function(){
		if(DEBUG){
			console.log("mic_intensity ");
		}
		var num = parseInt(cachedValues[2]); 
		
		var intensity = parseInt(((num >> 8) % 8));
		return intensity;
	};
	
	ext.sound_detected=function(){
		if(DEBUG){
			console.log("sound_detected ");
		}
		var num = parseInt(cachedValues[2]); 
		
		var intensity = parseInt(((num >> 8) % 8));
		if(intensity>2) return true;
		else return intensity;
	};
	
	ext.motor_target = function(menu){
		
		if(DEBUG){
			console.log("motor_target ");
		}
		if(menu==menus[lang]['leftright'][0])
			return parseInt(cachedValues[6]/32*10);
		else if(menu==menus[lang]['leftright'][1])
			return parseInt(cachedValues[7]/32*10);
			
	};
	
	ext.motor_speed = function(menu){
		if(DEBUG){
			console.log("motor_speed "+menu);
		}
		if(menu==menus[lang]['leftright'][0])
			return parseInt(cachedValues[8]/32*10);
		else if(menu==menus[lang]['leftright'][1])
			return parseInt(cachedValues[9]/32*10);
			
	};
	
	ext.motor = function(menu){
	
		if(DEBUG){
			console.log("motor "+menu);
		}
		if(menu==menus[lang]['leftright'][0])
			return parseInt(cachedValues[8]);
		else if(menu==menus[lang]['leftright'][1])
			return parseInt(cachedValues[9]);
			
	};
	
	ext.tilt = function(menu){
		if(DEBUG){
			console.log("tilt "+menu);
		}
		//console.log("tilt "+parseInt(cachedValues[1]));
		var num=cachedValues[1];
		if(menu==menus[lang]['tilts'][2]){
			return (((num >> 10) % 32)-16)*2;
		}else if(menu==menus[lang]['tilts'][0]){
			return (((num >> 5) % 32)-16)*2;
		}else if(menu==menus[lang]['tilts'][1]){
			return ((num % 32)-16)*2;
		}else{
			return 0;
		}
		
	};
	
	ext.bump = function(value){
		if(DEBUG){
			console.log("bump ");
		}
		//console.log("tilt "+parseInt(cachedValues[1]));
		value=parseInt(value);
		var num=cachedValues[1];
		var acc0=(((num >> 10) % 32)-16)*2
		var acc1=(((num >> 5) % 32)-16)*2;
		var acc2=((num % 32)-16)*2
		var ave=(acc0+acc1+acc2)/3;
		if(parseInt(ave)>value){
			return true;
		}else{
			return false;
		}
		
	};
	
	 ext.A_sound_play_sd = function(sound){
		if(DEBUG){
			console.log("A_sound_play_sd "+sound);
		}
	
		var args = Array();
		args.push(parseInt(sound));
		
		sendAction('A_sound_play',args);
	    
    };
    
     ext.A_sound_record = function(sound){
		if(DEBUG){
			console.log("A_sound_record "+sound);
		}
	
		
		var args = Array();
		args.push(parseInt(sound));
		
		sendAction('A_sound_record',args);
	    
    };
    
     ext.A_sound_replay = function(sound){
		if(DEBUG){
			console.log("A_sound_replay "+sound);
		}
	
		var args = Array();
		args.push(parseInt(sound));
		
		sendAction('A_sound_replay',args);
	    
    };
    
    ext.touching = function(sensor){
		if(DEBUG){
			console.log("touching "+sensor);
		}
		
		if(sensor==menus[lang]['sensors'][0]){ //front
			var value=0;
			for(i=0;i<5;i++){
    			value=value+parseInt(cachedValues[17+i]);
    		}
    		if(value/1000>0){
    			return true;
    		}
    		else{
    			return false;
    		}
		}else if(sensor==menus[lang]['sensors'][1]){//back
			var value=parseInt(cachedValues[22])+parseInt(cachedValues[23]);
			
    		if(value/1000>0){
    			return true;
    		}
    		else{
    			return false;
    		}
		}else{//ground
			var value=parseInt(cachedValues[15])+parseInt(cachedValues[16]);
			
    		if(value/500>0){
    			return true;
    		}
    		else{
    			return false;
    		}
		}
		
	};
  
   // Check for GET param 'lang'
   
  
  var paramString = "";//window.location.search.replace(/^\?|\/$/g, '');
  var vars = paramString.split("&");
  var lang = 'fr';
  for (var i=0; i<vars.length; i++) {
    var pair = vars[i].split('=');
    if (pair.length > 1 && pair[0]=='lang')
      lang = pair[1];
  }

  var blocks = {
    en: [
      ["w", "move %n", "scratch_move", 50 ],
      ["w", "move %n with speed %n", "scratch_move_with_speed", 50,50 ],
      ["w", "move %n in %n s", "scratch_move_with_time", 50,1 ],
      ["w", "circle radius %n angle %n", "scratch_arc", 150, 45 ],
      ["w", "turn %n", "scratch_turn", 45 ],
     /* ["w", "turn %n with speed %n", "scratch_turn_with_speed", 45 ],
      ["w", "turn %n in %n s", "scratch_turn_with_time", 45 ],*/
      [" ", "motor %m.leftrightall %n", "scratch_motor", "left", 50],
      [" ", "stop motors", "scratch_stop" ],
      [" ", "leds dial all %n %n %n %n %n %n %n %n", "V_leds_circle", 0,8,16,32,0,8,16,32],
      [" ", "leds clear", "scratch_clear_leds" ],
      [" ", "leds set color %n on %m.light", "scratch_set_leds", 0, "all" ],
      [" ", "leds change color %n on %m.light", "scratch_change_leds", 0, "all" ],
      [" ", "leds RGB %m.light %n %n %n", "scratch_leds",  "all", 0, 0, 32],
      [" ", "play note %n during %n s", "A_sound_freq", 440, 1 ],
      [" ", "play system sound %m.sounds", "A_sound_system", 1 ],
      [" ", "play sound SD %n", "A_sound_play_sd", "" ],
      [" ", "record sound %n", "A_sound_record", "" ],
      [" ", "replay sound %n", "A_sound_replay", "" ],
      [" ", "odometer %n %n %n", "Q_set_odometer", 90, 0, 0 ],
      ["r", "measure motor %m.leftright", "motor", "left" ],
      ["r", "motor %m.leftright speed", "motor_speed", "left" ],
      ["r", "motor %m.leftright target", "motor_target", "left" ],
      ["r", "tilt on %m.tilts", "tilt", "front-back" ],
      ["r", "proximity sensor %m.zerotoseven", "proximity", "2"],
      ["r", "ground sensor %m.zeroone", "ground", 0 ],
      ["r", "distance %m.sensors", "distance", "front" ],
      ["r", "angle %m.angles", "angle", "front" ],
      ["r", "proximity sensors", "prox_horizontal" ],
      ["r", "ground sensors", "prox_ground_delta"],
      ["r", "sound level", "mic_intensity" ],
      ["r", "leds color %m.light", "leds", "top" ],
      ["r", "odometer %m.odo", "odo", "direction" ],
      ["b", "sound detected", "sound_detected"],
      ["b", "bump %n", "bump"],
      ["b", "object detected %m.sensors", "touching", "left"],
      [" ", "reset", "reset"]
    ],
    fr: [
      ["w", "avancer %n", "scratch_move", 50 ],
      ["w", "avancer %n avec vitesse %n", "scratch_move_with_speed", 50,50 ],
      ["w", "avancer %n en %n s", "scratch_move_with_time", 50,1 ],
      ["w", "cercle rayon %n angle %n", "scratch_arc", 150, 45 ],
      ["w", "tourner %n", "scratch_turn", 45 ],
      /*["w", "tourner %n avec vitesse %n", "scratch_turn_with_speed", 45 ],
      ["w", "tourner %n en %n s", "scratch_turn_with_time", 45 ],*/
      [" ", "moteur %m.leftrightall %n", "scratch_motor", "gauche", 50],
      [" ", "stop moteurs", "scratch_stop" ],
      [" ", "leds RVB %m.light %n %n %n", "scratch_leds",  "tout", 0, 0, 32],
      [" ", "leds cadran toutes %n %n %n %n %n %n %n %n", "V_leds_circle", 0,8,16,32,0,8,16,32],
      [" ", "éteindre leds", "scratch_clear_leds" ],
      [" ", "leds fixer couleur %n on %m.light", "scratch_set_leds", 0, "tout" ],
      [" ", "leds changer couleur %n pour %m.light", "scratch_change_leds", 0, "all" ],
      [" ", "jouer note %n pendant %n s", "A_sound_freq", 440, 1 ],
      [" ", "jouer son système %m.sounds", "A_sound_system", 1 ],
      [" ", "jouer son SD %n", "A_sound_play_sd", "" ],
      [" ", "enregistrer son %n", "A_sound_record", "" ],
      [" ", "rejouer son %n", "A_sound_replay", "" ],
      [" ", "odomètre %n %n %n", "Q_set_odometer", 90, 0, 0 ],  	
      ["r", "mesure moteur %m.leftright", "motor", "gauche" ],
      ["r", "moteur %m.leftright vitesse", "motor_speed", "gauche" ],
      ["r", "moteur %m.leftright target", "motor_target", "gauche" ],
      ["r", "inclinaison %m.tilts", "tilt", "devant-derrière" ],
      ["r", "capteur horizontal %m.zerotoseven", "proximity", 2 ],
      ["r", "capteur dessous %m.zeroone", "ground", 0 ],
      ["r", "distance %m.sensors", "distance", "devant" ],
      ["r", "angle %m.angles", "angle", "devant" ],
      ["r", "capteurs horizontaux", "prox_horizontal" ],
      ["r", "capteurs dessous", "prox_ground_delta"],
      ["r", "niveau sonore", "mic_intensity" ],
      ["r", "leds couleur %m.singlelight", "leds", "dessus" ],
      ["r", "odomètre %m.odo", "odo", "direction" ],
      ["b", "bruit", "sound_detected"],
      ["b", "chock %n", "bump"],
      ["b", "objet détecté %m.sensors", "touching", "devant"],
      [" ", "reset", "reset"]
    ]
  };

  var menus = {
    en: {
    	leftrightall: ["left", "right", "all"],
    	leftright: ["left", "right"],
    	zeroone: ["0","1"],
    	zerotoseven: ["0","1","2","3","4","5","6"],
    	sensors: [ "front", "back", "ground" ],
    	singlelight: ["top","bottom-left","bottom-right"],
    	light: ["all","top","bottom","bottom-left","bottom-right"],
    	angles: [ "front", "back", "ground"  ],
    	sounds: ["0","1","2","3","4","5","6","7"],
    	odo: [ "direction", "x", "y" ],
    	tilts: [ "front-back", "top-bottom", "left-right" ]
    	
    },
    fr: {
    	leftrightall: [ "gauche", "droite","tous"],
    	leftright: ["gauche", "droite"],
    	zeroone: ["0","1"],
    	zerotoseven: ["0","1","2","3","4","5","6","7"],
    	sensors: [ "devant", "derrière", "dessous" ],
    	singlelight: [ "dessus", "dessous gauche", "dessous droite" ],
    	light: [ "tout", "dessus", "dessous", "dessous gauche", "dessous droite" ],
    	angles: [ "devant", "derrière", "dessous"  ],
    	sounds: ["0","1","2","3","4","5","6","7"],
    	odo: [ "direction", "x", "y" ],
    	tilts: [  "devant-derrière", "dessus-dessous" ,"gauche-droite à plat"]
    	
    }
  
  };

  var descriptor = {
    blocks: blocks[lang],
    menus: menus[lang]
    /*,
    url: 'http://khanning.github.io/scratch-arduino-extension'*/
  };

    // Register the extension
    ScratchExtensions.register('Thymio', descriptor, ext);
    
    
    //Utilities
  
    function clamp(val,min,max){
    	return val = (val < min ? min : (val > max ? max : val));
	}
	
	function sendAction(action,args,callback){
    	
    	var params=args.join("/")
    	$.ajax({
              url: ASEBAHTTPURL+'nodes/thymio-II/'+action+'/'+params,
              dataType: 'json',
              success: function( data ) {
                
                if(DEBUG){
               		console.log("send: "+ASEBAHTTPURL+'nodes/thymio-II/'+action+'/'+params);
              	}
              	console.log(typeof callback);
              	if(typeof callback == 'function'){
					console.log("call callback");
					callback();
				}else{
					console.log("NO call callback");
				}
				
              	
              }
        });
        
	}

    
    
    function findGetParameter(parameterName) {
  		var result = null,
        tmp = [];
    	var items = location.search.substr(1).split("&");
    	for (var index = 0; index < items.length; index++) {
        	tmp = items[index].split("=");
        	if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    	}
    	return result;
	}

	function makeLedsRGBVector(color)
    {
    	console.log(color);
        var rgb=[];
        switch (parseInt(color / 33))
        {
            case 0: rgb[0]=33; rgb[1]=color%33; rgb[2]=0; break;
            case 1: rgb[0]=33-color%33; rgb[1]=33; rgb[2]=0; break;
            case 2: rgb[0]=0; rgb[1]=33; rgb[2]=color%33; break;
            case 3: rgb[0]=0; rgb[1]=33-color%33; rgb[2]=33; break;
            case 4: rgb[0]=color%33; rgb[1]=0; rgb[2]=33; break;
            case 5: rgb[0]=33; rgb[1]=0; rgb[2]=33-color%33; break;
        }
        	console.log(rgb);
        return rgb;
    }
    
    
})({});
