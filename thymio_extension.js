/**
* Thymio exension for ScratchX
* v 1.1 for internal use
* Created by Elisa Bernardoni on July 14, 2017
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Lesser General Public License as published
* by the Free Software Foundation, version 3 of the License.
*	
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Lesser General Public License for more details.
*	
* You should have received a copy of the GNU Lesser General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>.	
*/

(function(ext) {

    var ASEBAHTTPURL = 'http://localhost:3000/';
    var VMAX = 500;
    var VMIN = -500;
    var DEBUG = false;
    var LMAX = 32;
    var LMIN = 0;

    var source = null;
    var connected = 0;
    var eventCompleteCallback = false;
    var cachedValues = Array();
    var leds = [0, 0, 0];
    var dial = -1;


	loadAesl();
	connect();
	

    /**
     * Cleanup function when the extension is unloaded
     */
    ext._shutdown = function() {
        if (DEBUG) {
            console.log("SHUTDOWN");
        }

        var args = Array();
        sendAction('Q_reset', args, function() {
            cachedValues = Array();
            disconnect();

        });

    };


    /**
     * Reset function mandatory for ScratchX- call Q_reset
     */
    ext.resetAll = function() {
        if (DEBUG) {
            console.log("resetAll");
        }
        //TODO dial
        //TODO Leds
        //TODO motors
        //leds ?

        var args = Array();
        sendAction('Q_reset', args, function() {
            cachedValues = Array();


        });
    };
    /*
        ext.poll = function() {
            console.log("poll");
            //ScratchX does not call poll
        };
    */


    /**
     * Status reporting code
     * Use this to report missing hardware, plugin or unsupported browser
     */
    ext._getStatus = function() {
        if (connected == 0) return {
            status: 0,
            msg: 'Thymio disconnected'
        };
        if (connected == 1) return {
            status: 1,
            msg: 'Probing for Thymio'
        };
        return {
            status: 2,
            msg: 'Ready'
        };
    };


    /**
     * The function subscribes to the Thymio’s SSE stream, sets an Event Listener on messages received
     * and stores R_state variable in cachedValues
     */

    function connect() {

       
        if (source) {
            source.close();
            source = null;
        }

        source = new EventSource(ASEBAHTTPURL + 'nodes/thymio-II/events');

        source.addEventListener('open', function(e) {
            if (DEBUG) {
                console.log("open");
            }
        });

        source.addEventListener('message', function(e) {

            eventData = e.data.split(" ");
	    connected = 2;
            if (eventData[0] == "R_state_update") {
                cachedValues = eventData;
                //console.log("cached "+cachedValues);
                
            } else {
                if (DEBUG) {
                    console.log("emitted " + eventData)
                }
            }


            // If block requires to check event message for completion, it will set eventCompleteCallback
            if (typeof eventCompleteCallback == 'function') {
                // We pass eventData to be able to read event message
                eventCompleteCallback(eventData);
            }

        });

        source.addEventListener('error', function(e) {

            disconnect('Event stream closed');
            connected = 0;
            connect();

        });



    }

    /**
     * The function closes the Event Source.
     */
    function disconnect() {

        if (source) {
            source.close();
            source = null;
        }
        connected = 0;
    }

    /**
     * The function sends code of thymio_motion.aesl to asebahttp bridge
     */

    function loadAesl() {
		if(DEBUG){
			console.log("Send Aesl for Thymio");
		}
		
		var xmlstring='<!DOCTYPE aesl-source> \
<network> \
<!--list of global events--> \
<event size="4" name="Q_add_motion"/> \
<event size="1" name="Q_cancel_motion"/> \
<event size="5" name="Q_motion_added"/> \
<event size="5" name="Q_motion_cancelled"/> \
<event size="5" name="Q_motion_started"/> \
<event size="5" name="Q_motion_ended"/> \
<event size="1" name="Q_motion_noneleft"/> \
<event size="3" name="Q_set_odometer"/> \
<event size="8" name="V_leds_prox_h"/> \
<event size="8" name="V_leds_circle"/> \
<event size="3" name="V_leds_top"/> \
<event size="4" name="V_leds_bottom"/> \
<event size="2" name="V_leds_prox_v"/> \
<event size="4" name="V_leds_buttons"/> \
<event size="1" name="V_leds_rc"/> \
<event size="2" name="V_leds_temperature"/> \
<event size="1" name="V_leds_sound"/> \
<event size="2" name="A_sound_freq"/> \
<event size="1" name="A_sound_play"/> \
<event size="1" name="A_sound_system"/> \
<event size="1" name="A_sound_replay"/> \
<event size="1" name="A_sound_record"/> \
<event size="1" name="M_motor_left"/> \
<event size="1" name="M_motor_right"/> \
<event size="27" name="R_state_update"/> \
<event size="0" name="Q_reset"/> \
<!--list of constants--> \
<constant value="4" name="QUEUE"/> \
<!--show keywords state--> \
<keywords flag="true"/> \
<!--node thymio-II--> \
<node nodeId="1" name="thymio-II"> \
var tmp[9] \
var Qid[QUEUE]   = [ 0,0,0,0 ] \
var Qtime[QUEUE] = [ 0,0,0,0 ] \
var QspL[QUEUE]  = [ 0,0,0,0 ] \
var QspR[QUEUE]  = [ 0,0,0,0 ] \
var Qpc = 0  \
var Qnx = 0  \
var distance.front = 190  \
var distance.back  = 125 \
var angle.front    = 0  \
var angle.back     = 0 \
var angle.ground   = 0 \
var odo.delta  \
var odo.theta = 0  \
var odo.x = 0  \
var odo.y = 0  \
var odo.degree  \
var R_state.do = 1  \
var R_state[27]  \
mic.threshold = 12 \
onevent motor  \
odo.delta = (motor.right.target + motor.left.target) / 2 \
call math.muldiv(tmp[0], (motor.right.target - motor.left.target), 3406, 10000) \
odo.theta += tmp[0] \
call math.cos(tmp[0:1],[odo.theta,16384-odo.theta]) \
call math.muldiv(tmp[0:1], [odo.delta,odo.delta],tmp[0:1], [32767,32767]) \
odo.x += tmp[0]/45 \
odo.y += tmp[1]/45 \
odo.degree = 90 - (odo.theta / 182) \
if Qtime[Qpc] > 0 then \
	emit Q_motion_started([Qid[Qpc], Qtime[Qpc], QspL[Qpc], QspR[Qpc], Qpc]) \
	Qtime[Qpc] = 0 - Qtime[Qpc] \
end \
if Qtime[Qpc] &lt; 0 then \
	motor.left.target = QspL[Qpc] \
	motor.right.target = QspR[Qpc] \
	Qtime[Qpc] += 1 \
	if Qtime[Qpc] == 0 then \
		emit Q_motion_ended([Qid[Qpc], Qtime[Qpc], QspL[Qpc], QspR[Qpc], Qpc]) \
		Qid[Qpc] = 0 \
		Qpc = (Qpc+1)%QUEUE \
		if Qtime[Qpc] == 0 and Qpc == Qnx then \
			emit Q_motion_noneleft([Qpc]) \
			motor.left.target = 0 \
			motor.right.target = 0 \
		end \
	end \
end \
if Qtime[Qpc] == 0 and Qpc != Qnx then \
	Qpc = (Qpc+1)%QUEUE \
end \
call math.fill(tmp,0) \
tmp[Qnx]=1 \
tmp[Qpc]=4 \
call leds.buttons(tmp[0],tmp[1],tmp[2],tmp[3]) \
sub motion_add \
if (Qnx != Qpc or (Qnx == Qpc and Qtime[Qpc] == 0)) and Qid[0]!=tmp[0] and Qid[1]!=tmp[0] and Qid[2]!=tmp[0] and Qid[3]!=tmp[0] then \
	Qid[Qnx]   = tmp[0] \
	Qtime[Qnx] = tmp[1] \
	QspL[Qnx]  = tmp[2] \
	QspR[Qnx]  = tmp[3] \
	emit Q_motion_added([Qid[Qnx], Qtime[Qnx], QspL[Qnx], QspR[Qnx], Qnx]) \
	Qnx = (Qnx+1)%QUEUE \
end \
sub motion_cancel \
for tmp[1] in 1:QUEUE do \
	if Qid[tmp[1]-1] == tmp[0] then \
		emit Q_motion_cancelled([Qid[tmp[1]-1], Qtime[tmp[1]-1], QspL[tmp[1]-1], QspR[tmp[1]-1], tmp[1]-1]) \
		Qtime[tmp[1]-1] = -1  \
	end \
end \
 \
onevent Q_add_motion \
tmp[0:3] = event.args[0:3] \
callsub motion_add \
 \
onevent Q_cancel_motion \
tmp[0] = event.args[0] \
callsub motion_cancel \
 \
onevent Q_set_odometer \
odo.theta = (((event.args[0] + 360) % 360) - 90) * 182 \
odo.x = event.args[1] * 28 \
odo.y = event.args[2] * 28 \
 \
onevent Q_reset \
call math.fill(Qid,0) \
call math.fill(Qtime,0) \
call math.fill(QspL,0) \
call math.fill(QspR,0) \
call math.fill(Qpc,0) \
call math.fill(Qnx,0) \
motor.left.target = 0 \
motor.right.target = 0 \
emit Q_motion_noneleft([Qpc]) \
 \
onevent buttons \
call math.dot(distance.front, prox.horizontal,[13,26,39,26,13,0,0],11) \
call math.clamp(distance.front,190-distance.front,0,190) \
call math.max(distance.back, prox.horizontal[5],prox.horizontal[6]) \
call math.muldiv(distance.back, distance.back, 267,10000) \
call math.clamp(distance.back,125-distance.back,0,125) \
call math.dot(angle.front, prox.horizontal,[4,3,0,-3,-4,0,0],9) \
call math.dot(angle.back, prox.horizontal,[0,0,0,0,0,-4,4],9) \
call math.dot(angle.ground, prox.ground.delta,[4,-4],7) \
R_state = [	((((acc[0]/2)+16)%32)&lt;&lt;10) + ((((acc[1]/2)+16)%32)&lt;&lt;5) + (((acc[2]/2)+16)%32), \
			(((mic.intensity/mic.threshold)%8)&lt;&lt;8) + \
				(0&lt;&lt;5) + \
				(button.backward&lt;&lt;4) + \
				(button.center&lt;&lt;3) + \
				(button.forward&lt;&lt;2) + \
				(button.left&lt;&lt;1) + \
				button.right, \
			((angle.ground+90) &lt;&lt; 8) + (angle.back+90), \
			angle.front, \
			(distance.back&lt;&lt;8) + distance.front, \
			motor.left.target, \
			motor.right.target, \
			motor.left.speed, \
			motor.right.speed, \
			odo.degree, \
			odo.x, \
			odo.y, \
			prox.comm.rx, \
			prox.comm.tx, \
			prox.ground.delta[0:1], \
			prox.horizontal[0:6], \
			Qid[0:3] \
		  ] \
 \
onevent prox \
if R_state.do==1 then \
	emit R_state_update(R_state) \
end \
\
onevent V_leds_bottom \
if event.args[0]==0 then \
	call leds.bottom.left(event.args[1],event.args[2],event.args[3]) \
else \
	call leds.bottom.right(event.args[1],event.args[2],event.args[3]) \
end \
 \
onevent V_leds_buttons \
call leds.buttons(event.args[0],event.args[1], \
                  event.args[2],event.args[3]) \
 \
onevent V_leds_circle \
call leds.circle(event.args[0],event.args[1],event.args[2], \
	             event.args[3],event.args[4],event.args[5], \
	             event.args[6],event.args[7]) \
 \
onevent V_leds_prox_h \
call leds.prox.h(event.args[0],event.args[1],event.args[2], \
	             event.args[3],event.args[4],event.args[5], \
	             event.args[6],event.args[7]) \
 \
onevent V_leds_prox_v \
call leds.prox.v(event.args[0],event.args[1]) \
 \
onevent V_leds_rc \
call leds.rc(event.args[0]) \
 \
onevent V_leds_sound \
call leds.sound(event.args[0]) \
 \
onevent V_leds_temperature \
call leds.temperature(event.args[0],event.args[1]) \
 \
onevent V_leds_top \
call leds.top(event.args[0],event.args[1],event.args[2]) \
 \
onevent A_sound_system \
call sound.system(event.args[0]) \
 \
onevent A_sound_freq \
call sound.freq(event.args[0],event.args[1]) \
 \
onevent A_sound_play \
call sound.play(event.args[0]) \
 \
onevent A_sound_record \
call sound.record(event.args[0]) \
 \
onevent A_sound_replay \
call sound.replay(event.args[0]) \
 \
onevent M_motor_left \
motor.left.target = event.args[0] \
 \
onevent M_motor_right \
motor.right.target = event.args[0] \
 \
</node> \
</network>';

		$.ajax({
  			url: 'http://localhost:3000/nodes/thymio-II',
  			type: 'PUT',
  			data: xmlstring,
  			success: function(data) {
  				connect();
    	 
  			}
		});


      	
    	

    }



    /**
     * The robot moves forward.  If the distance is negative, the robot moves back.
     * Speed about 100 mm/s.
     * @param {distance} number - Distance in mm
     * @param {function} callback - ScratchX callback function
     */
    ext.scratch_move = function(distance, callback) {

        if (DEBUG) {
            console.log("call scratch_move " + distance);
        }

        // Construct args to send with request
        var mm = parseInt(distance);
        if (mm == 0) {
            var args = Array();
            args.push(100 * 32 / 10); //speed=10mm/s
            sendAction('M_motor_left', args, function() {
                sendAction('M_motor_right', args, callback);
            });

        } else {
            var speed;
            if (Math.abs(mm) < 20) {
                speed = 20;
            } else {
                if (Math.abs(mm) > 150) {
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
            if (mm > 0) {
                args.push(speed);
                args.push(speed);
            } else {
                args.push(speed * -1);
                args.push(speed * -1);
            }

            // Send request
            requestSend(args, 2,
                function(resp) {



                    if (DEBUG) {
                        console.log("sent scratch_move " + distance);
                    }

                    // Set message to look for in event "message" and execute callback (next block) when received
                    eventCompleteCallback = function(eventData) {

                        if (eventData[0].match(/^Q_motion_noneleft/)) {
                            if (DEBUG) {
                                console.log(eventData[0] + "=> call callback ");
                            }

                            callback();
                        };
                    };

                });
        }
    };

    /**
     * The robot moves forward with a given speed.  If the distance is negative, the robot moves back.
     * If the value of the distance is not specified, the robot does not stop.
     * @param {distance} number - Distance in mm
     * @param {speed} number - Speed in mm/s
     * @param {function} callback - ScratchX callback function
     */
    ext.scratch_move_with_speed = function(distance, speed, callback) {

        if (DEBUG) {
            console.log("called scratch_move_with_speed " + distance);
        }

        // Construct args to send with request
        var mm = parseInt(distance);
        var speed = parseInt(Math.abs(speed));
        speed = parseInt(clamp(speed, VMIN * 10 / 32, VMAX * 10 / 32));

        if (mm == 0) {
            var args = Array();
            args.push(speed * 32 / 10); //speed=10mm/s
            sendAction('M_motor_left', args, function() {
                sendAction('M_motor_right', args, callback);
            });

        } else {
            var time = Math.abs(mm) * 100 / speed; // time measured in 100 Hz ticks
            speed = speed * 32 / 10;
            var args = Array();

            args.push("Q_add_motion");
            args.push(time);
            if (mm > 0) {
                args.push(speed);
                args.push(speed);
            } else {
                args.push(speed * -1);
                args.push(speed * -1);
            }

            // Send request
            requestSend(args, 2, function(resp) {



                if (DEBUG) {
                    console.log("sent scratch_move_with_speed " + distance);
                }

                // Set message to look for in event "message" and execute callback (next block) when received
                eventCompleteCallback = function(eventData) {

                    if (eventData[0].match(/^Q_motion_noneleft/)) {
                        if (DEBUG) {
                            console.log(eventData[0] + "=> call callback ");
                        }

                        callback();
                    };
                };

            });
        }
    };

    /**
     * The robot moves forward with a given time.  If the distance is negative, the robot moves back.
     * @param {distance} number - Distance in mm
     * @param {time} number - Time in s
     * @param {function} callback - ScratchX callback function
     */
    ext.scratch_move_with_time = function(distance, time, callback) {

        if (DEBUG) {
            console.log("called scratch_move_with_speed " + distance);
        }

        // Construct args to send with request
        var mm = parseInt(distance);
        var time = parseInt(Math.abs(time));
        var speed = parseInt(Math.abs(mm) / time);
        speed = parseInt(clamp(speed, VMIN * 10 / 32, VMAX * 10 / 32));

        var time = time * 100; // time measured in 100 Hz ticks
        speed = speed * 32 / 10;
        var args = Array();

        args.push("Q_add_motion");
        args.push(time);
        if (mm > 0) {
            args.push(speed);
            args.push(speed);
        } else {
            args.push(speed * -1);
            args.push(speed * -1);
        }

        // Send request
        requestSend(args, 2, function(resp) {



            if (DEBUG) {
                console.log("sent scratch_move_with_speed " + distance);
            }

            // Set message to look for in event "message" and execute callback (next block) when received
            eventCompleteCallback = function(eventData) {

                if (eventData[0].match(/^Q_motion_noneleft/)) {
                    if (DEBUG) {
                        console.log(eventData[0] + "=> call callback ");
                    }

                    callback();
                };
            };

        });

    };
    /**
     * The robot stops.
     */
    ext.scratch_stop = function() {
        if (DEBUG) {
            console.log("scratch_stop");
        }
        var args = Array();
        args.push(0);
        sendAction('M_motor_left', args, function() {
            sendAction('M_motor_right', args);
        });

    };



    /**
     * The robot moves on an arc of circle of a given radius and of a given angle
     * If the radius> 0, it goes forward otherwise goes backwards. If angle> 0 begins to the right, if negative, starts to the left.
     * @param {radius} number - Radius in mm
     * @param {angle} number - Angle in degrees
     * @param {function} callback - ScratchX callback function
     */
    ext.scratch_arc = function(radius, angle, callback) {
        if (DEBUG) {
            console.log("scratch_arc " + radius + " " + angle);
        }
        angle = parseInt(angle);
        radius = parseInt(radius);

        if (Math.abs(radius) < 100)
            radius = (radius < 0) ? -100 : 100; // although actually, we should just call scratch_turn

        var ratio = (Math.abs(radius) - 95) * 10000 / Math.abs(radius);
        var time = (angle * (50.36 * radius + 25)) / 3600;

        var v_out = 400;
        var v_in = v_out * ratio / 10000;

        if (radius < 0) {

            v_in = -v_in;
            v_out = -v_out;
        }

        var args = Array();
        args.push("Q_add_motion");
        args.push(time);
        args.push((angle > 0) ? v_out : v_in);
        args.push((angle > 0) ? v_in : v_out);


        // Send request
        requestSend(args, 2, function(resp) {

            if (DEBUG) {
                console.log("sent scratch_arc " + angle + " " + radius);
            }


            // Set message to look for in event "message" and execute callback (next block) when received
            eventCompleteCallback = function(eventData) {
                if (eventData[0].match(/^Q_motion_noneleft/)) {
                    if (DEBUG) {
                        console.log(eventData[0] + "=> call callback ");
                    }
                    callback();
                };
            };

        });


    };

    /**
     * The robots turns in place of a given angle (to the left if> 0, to the right if <0) then stops.
     * @param {angle} number - Angle in degrees
     * @param {function} callback - ScratchX callback function
     */
    ext.scratch_turn = function(angle, callback) {
        if (DEBUG) {
            console.log("scratch_turn " + angle);
        }

        angle = parseInt(angle);
        var speed, time;
        if (Math.abs(angle) > 90) {
            speed = 65 * 32 / 10;
            time = Math.abs(angle) * 1.3;
        } else {
            speed = 43 * 32 / 10;
            time = Math.abs(angle) * 2.0;
            time = angle * angle * 2.0 / (Math.abs(angle) * 1.016 - 0.52); // nonlinear correction
        }
        var args = Array();
        args.push("Q_add_motion");
        args.push(time);
        args.push((angle > 0) ? speed : speed * -1);
        args.push((angle > 0) ? speed * -1 : speed);


        // Send request
        requestSend(args, 2, function(resp) {

            if (DEBUG) {
                console.log("sent scratch_turn " + angle);
            }

            // Set message to look for in event "message" and execute callback (next block) when received
            eventCompleteCallback = function(eventData) {
                if (eventData[0].match(/^Q_motion_noneleft/)) {
                    if (DEBUG) {
                        console.log(eventData[0] + "=> call callback ");
                    }
                    callback();
                };
            };

        });

    };

    /**
     * The robots turns in place of a given angle with a given speed (to the left if angle> 0, to the right if angle <0) then stops.
     * If the value of the angle is not specified, the robot does not stop.
     * @param {angle} number - Angle in degrees
     * @param {speed} number - Speed in mm/s
     * @param {function} callback - ScratchX callback function
     */
    ext.scratch_turn_with_speed = function(angle, speed, callback) {

        if (DEBUG) {
            console.log("call scratch_turn_with_speed " + angle + " " + speed);
        }

        // Construct args to send with request
        var angle = parseInt(angle) * 0.78;
        var speed = parseInt(Math.abs(speed));
        speed = parseInt(clamp(speed, VMIN * 10 / 32, VMAX * 10 / 32));

        if (angle == 0) {
            var args = Array();
            args.push(speed * 32 / 10); //speed=10mm/s

            sendAction('M_motor_left', args, function() {
                args[0] = -args[0];
                sendAction('M_motor_right', args, callback);
            });

        } else {
            var time = Math.abs(angle) * 100 / speed; // time measured in 100 Hz ticks
            speed = speed * 32 / 10;
            var args = Array();

            args.push("Q_add_motion");
            args.push(time);
            if (angle > 0) {
                args.push(speed);
                args.push(speed * -1);
            } else {
                args.push(speed * -1);
                args.push(speed);
            }

            // Send request
            requestSend(args, 2, function(resp) {



                if (DEBUG) {
                    console.log("sent scratch_turn_with_speed " + angle + " " + speed);
                }

                // Set message to look for in event "message" and execute callback (next block) when received
                eventCompleteCallback = function(eventData) {

                    if (eventData[0].match(/^Q_motion_noneleft/)) {
                        if (DEBUG) {
                            console.log(eventData[0] + "=> call callback ");
                        }

                        callback();
                    };
                };

            });
        }
    };


    /**
     * The robots turns in place of a given angle in a given time (to the left if angle > 0, to the right if angle <0) then stops.
     * @param {angle} number - Angle in degrees
     * @param {time} number - Time in s
     * @param {function} callback - ScratchX callback function
     */
    ext.scratch_turn_with_time = function(angle, time, callback) {

        if (DEBUG) {
            console.log("call scratch_turn_with_time " + angle + " " + time);
        }

        // Construct args to send with request
        var angle = parseInt(angle) * 0.78;
        var time = parseInt(Math.abs(time));



        var speed = Math.abs(angle) / time; // time measured in 100 Hz ticks
        speed = speed * 32 / 10;
        var args = Array();

        args.push("Q_add_motion");
        args.push(time * 100);
        if (angle > 0) {
            args.push(speed);
            args.push(speed * -1);
        } else {
            args.push(speed * -1);
            args.push(speed);
        }

        // Send request
        requestSend(args, 2, function(resp) {



            if (DEBUG) {
                console.log("call scratch_turn_with_time " + angle + " " + time);
            }

            // Set message to look for in event "message" and execute callback (next block) when received
            eventCompleteCallback = function(eventData) {

                if (eventData[0].match(/^Q_motion_noneleft/)) {
                    if (DEBUG) {
                        console.log(eventData[0] + "=> call callback ");
                    }

                    callback();
                };
            };

        });

    };


    /**
     * Run the left/right/all motors.
     * @param {motor} string - Item of menu 'leftrightal'.
     * @param {value} value - Speed in Aseba unities.
     */
    ext.scratch_motor = function(motor, value) {

        value = parseInt(clamp(value, VMIN, VMAX));
        if (DEBUG) {
            console.log("called scratch_motor " + value);
        }
        var args = Array();
        args.push(value);
        if (motor == menus[lang]['leftrightall'][0]) {
            sendAction('M_motor_left', args);
        } else if (motor == menus[lang]['leftrightall'][1]) {
            sendAction('M_motor_right', args);
        } else {
            sendAction('M_motor_left', args, function() {
                sendAction('M_motor_right', args);
            });

        }


    };

    /**
     * Returns the value returned by a given position sensor.
     * @param {sensor} number - 0 for the left, 1 for the right
     */

    ext.ground = function(sensor) {

        if (DEBUG) {
            console.log("called ground " + sensor);
        }
        sensor = parseInt(sensor);
        if (sensor == 0 || sensor == 1)
            return parseInt(cachedValues[15 + parseInt(sensor)]);
        else return 0;
    };

    /**
     * Returns the value returned by a given position sensor.
     * @param {sensor} number - 0 to 6 (front 0 to 4, back 6 or 7)
     */
    ext.proximity = function(sensor) {

        if (DEBUG) {
            console.log("called proximity " + sensor);
        }
        sensor = parseInt(sensor);
        if (sensor >= 0 && sensor <= 6)
            return parseInt(cachedValues[17 + sensor]);
        else return 0;

    };

    /**
     * Returns the value returned by a given position sensor.
     * @param {proxsensor} string - Item of menu 'proxsensors'.
     */
    ext.proximity2 = function(proxsensor) {


        if (DEBUG) {
            console.log("called proximity2 " + proxsensor);
        }
        var sensor = -1;
        if (proxsensor == menus[lang]['proxsensors'][0]) {
            sensor = 0;
        } else if (proxsensor == menus[lang]['proxsensors'][1]) {
            sensor = 1;
        } else if (proxsensor == menus[lang]['proxsensors'][2]) {
            sensor = 2;
        } else if (proxsensor == menus[lang]['proxsensors'][3]) {
            sensor = 3;
        } else if (proxsensor == menus[lang]['proxsensors'][4]) {
            sensor = 4;
        } else if (proxsensor == menus[lang]['proxsensors'][5]) {
            sensor = 5;
        } else if (proxsensor == menus[lang]['proxsensors'][6]) {
            sensor = 6;
        }

        if (sensor >= 0 && sensor <= 6)
            return parseInt(cachedValues[17 + sensor]);
        else return 0;

    };

    /**
     * Sets the color RGB of a given led.
     * @param {led} string - Item of menu 'light'
     * @param {r} number - Red value (0 to 32)
     * @param {g} number - Green value (0 to 32)
     * @param {b} number - Blue value (0 to 32)
     */

    ext.scratch_leds = function(led, r, g, b) {

        if (DEBUG) {
            console.log("call scratch_leds " + led + " " + r + " " + g + " " + b);
        }

        var args = Array();
        args.push(parseInt(clamp(r, LMIN, LMAX)));
        args.push(parseInt(clamp(g, LMIN, LMAX)));
        args.push(parseInt(clamp(b, LMIN, LMAX)));

        if (led == menus[lang]['light'][0]) {

            sendAction('V_leds_top', args);
            args.unshift(0);
            sendAction('V_leds_bottom', args);
            args[0] = 1;
            sendAction('V_leds_bottom', args);

        } else if (led == menus[lang]['light'][1]) {

            sendAction('V_leds_top', args);

        } else if (led == menus[lang]['light'][2]) {

            args.unshift(0);
            sendAction('V_leds_bottom', args);
            args[0] = 1;
            sendAction('V_leds_bottom', args);

        } else if (led == menus[lang]['light'][3]) {

            args.unshift(0);
            sendAction('V_leds_bottom', args);

        } else if (led == menus[lang]['light'][4]) {

            args.unshift(1);
            sendAction('V_leds_bottom', args);

        }


    };

    /**
     * Adds the value to the current color for a given led.
     * Color coding Scratch (0 to 200) 0 red → chroma circle mod 198
     * @param {color} number - Value to add.
     * @param {led} string - Item of menu 'light'
     */
    ext.scratch_change_leds = function(color, led) {

        if (DEBUG) {
            console.log("call scratch_change_leds " + color + " " + led);
        }


        var mask;
        if (led == menus[lang]['light'][0]) //ALL
            mask = 7;
        else if (led == menus[lang]['light'][1]) //TOP
            mask = 1;
        else if (led == menus[lang]['light'][2]) //BOTTOM
            mask = 6;
        else if (led == menus[lang]['light'][3]) //BOTTOM Left
            mask = 2;
        else if (led == menus[lang]['light'][4]) //BOTTOM Right
            mask = 4;
        else
            mask = 7;

        if (mask == 1) {

            var rgb = makeLedsRGBVector((parseInt(color + leds[0]) % 198));
            sendAction('V_leds_top', rgb, function() {
                leds[0] = color + leds[0];
            });
        } else if (mask == 2) {
            var rgb = makeLedsRGBVector((parseInt(color + leds[1]) % 198));
            rgb.unshift(0);
            sendAction('V_leds_bottom', rgb, function() {
                leds[1] = color + leds[1];
            });
        } else if (mask == 4) {
            var rgb = makeLedsRGBVector((parseInt(color + leds[2]) % 198));
            rgb.unshift(1);
            sendAction('V_leds_bottom', rgb, function() {
                leds[2] = color + leds[2];
            });
        } else if (mask == 6) {
            var rgb = makeLedsRGBVector((parseInt(color + leds[1]) % 198));
            rgb.unshift(0);
            sendAction('V_leds_bottom', rgb, function() {
                leds[1] = color + leds[1];
                rgb = makeLedsRGBVector((parseInt(color + leds[2]) % 198));
                rgb.unshift(1);
                sendAction('V_leds_bottom', rgb, function() {
                    leds[2] = color + leds[2];
                });
            });
        } else {
            var rgb = makeLedsRGBVector((parseInt(color + leds[0]) % 198));
            sendAction('V_leds_top', rgb, function() {
                leds[0] = color + leds[0];
                rgb = makeLedsRGBVector((parseInt(color + leds[1]) % 198));
                rgb.unshift(0);
                sendAction('V_leds_bottom', rgb, function() {
                    leds[1] = color + leds[1];
                    rgb = makeLedsRGBVector((parseInt(color + leds[2]) % 198));
                    rgb.unshift(1);
                    sendAction('V_leds_bottom', rgb, function() {
                        leds[2] = color + leds[2];
                    });
                });
            });

        }

    };

    /**
     * Sets the color for a given led.
     * Color coding Scratch (0 to 200) 0 red → chroma circle mod 198
     * @param {color} number - Value to add.
     * @param {led} string - Item of menu 'light'
     */

    ext.scratch_set_leds = function(color, led) {

        if (DEBUG) {
            console.log("call scratch_set_leds " + color + " " + led);
        }

        color = parseInt(color) % 198;
        var mask;
        if (led == menus[lang]['light'][0]) //ALL
            mask = 7;
        else if (led == menus[lang]['light'][1]) //TOP
            mask = 1;
        else if (led == menus[lang]['light'][2]) //BOTTOM
            mask = 6;
        else if (led == menus[lang]['light'][3]) //BOTTOM Left
            mask = 2;
        else if (led == menus[lang]['light'][4]) //BOTTOM Right
            mask = 4;
        else
            mask = 7;



        var rgb = makeLedsRGBVector(color); // by default, "V_leds_top"

        if (mask == 1) {
            sendAction('V_leds_top', rgb, function() {
                leds[0] = color;
            });
        } else if (mask == 2) {
            rgb.unshift(0);
            sendAction('V_leds_bottom', rgb, function() {
                leds[1] = color;
            });
        } else if (mask == 4) {
            rgb.unshift(1);
            sendAction('V_leds_bottom', rgb, function() {
                leds[2] = color;
            });
        } else if (mask == 6) {
            rgb.unshift(0);
            sendAction('V_leds_bottom', rgb, function() {
                leds[1] = color;
                rgb[0] = 1;
                sendAction('V_leds_bottom', rgb, function() {
                    leds[2] = color;
                });
            });
        } else {
            sendAction('V_leds_top', rgb, function() {
                leds[0] = color;
                rgb.unshift(0);
                sendAction('V_leds_bottom', rgb, function() {
                    leds[1] = color;
                    rgb[0] = 1;
                    sendAction('V_leds_bottom', rgb, function() {
                        leds[2] = color;
                    });
                });
            });

        }

    };

    /**
     * Returns the temperature in °C
     */

    ext.temperature = function(callback) {

        if (DEBUG) {
            console.log("called temperature");
        }

        var args = Array();

        sendAction('temperature', args, function(data) {

            callback(parseInt(data[0]) / 10);
        });


    };

    /**
     * Returns the color for a given led.
     * @param {led} string - Item of menu 'singlelight'
     */
    ext.leds = function(led) {

        if (DEBUG) {
            console.log("called leds " + led);
        }

        if (led == menus[lang]['singlelight'][0]) {

            return leds[0];

        } else if (led == menus[lang]['singlelight'][1]) {

            return leds[1];

        } else if (led == menus[lang]['singlelight'][2]) {

            return leds[2];

        }
    };

    /**
     * Lights the circle LEDs
     * @param {l0} number - 0 to 32
     * @param {l1} number - 0 to 32
     * @param {l2} number - 0 to 32
     * @param {l3} number - 0 to 32
     * @param {l4} number - 0 to 32
     * @param {l5} number - 0 to 32
     * @param {l6} number - 0 to 32
     * @param {l7} number - 0 to 32
     */
    ext.V_leds_circle = function(l0, l1, l2, l3, l4, l5, l6, l7) {
        if (DEBUG) {
            console.log("called V_leds_circle " + l0 + " " + l1 + " " + l2 + " " + l3 + " " + l4 + " " + l5 + " " + l6 + " " + l7);
        }

        var args = Array();
        args.push(parseInt(clamp(l0, LMIN, LMAX)));
        args.push(parseInt(clamp(l1, LMIN, LMAX)));
        args.push(parseInt(clamp(l2, LMIN, LMAX)));
        args.push(parseInt(clamp(l3, LMIN, LMAX)));
        args.push(parseInt(clamp(l4, LMIN, LMAX)));
        args.push(parseInt(clamp(l5, LMIN, LMAX)));
        args.push(parseInt(clamp(l6, LMIN, LMAX)));
        args.push(parseInt(clamp(l7, LMIN, LMAX)));

        sendAction('V_leds_circle', args);
    };

    /**
     * Lights the next circle LED
     * @param {menu} number - Item of 'leftright' menu
     */
    ext.scratch_next_dial = function(menu) {
        if (DEBUG) {
            console.log("called scratch_next_dial " + menu);
        }

        if (dial == -1) {
            dial = 0;
        } else {
            if (menu == menus[lang]['leftright'][0]) {
                dial = (dial + 1) % 8;
            } else {
                dial = (8 + (dial - 1)) % 8;
            }

        }


        var args = Array();
        for (i = 0; i < 8; i++)
            args.push(0);
        args[dial] = 32;

        sendAction('V_leds_circle', args);
    };


    /**
     * Sets the value of prox.comm.tx
     * @param {value} number - prox.comm.tx value to set
     */
    ext.emit = function(value) {
        if (DEBUG) {
            console.log("called emit " + value);
        }
        value = parseInt(value)
        var args = Array();
        args.push(value);

        sendAction('prox.comm.tx', args);
    };

    /**
     * Lights the button LEDs
     * @param {forward} number - Forward LED value (0 to 32)
     * @param {right} number - Right LED value (0 to 32)
     * @param {backward} number - Backward LED value (0 to 32)
     * @param {left} number - Left LED value (0 to 32)
     */
    ext.V_leds_buttons = function(forward, right, backward, left) {
        if (DEBUG) {
            console.log("called V_leds_buttons " + forward + " " + right + " " + backward + " " + left);
        }

        var args = Array();
        args.push(parseInt(clamp(forward, LMIN, LMAX)));
        args.push(parseInt(clamp(right, LMIN, LMAX)));
        args.push(parseInt(clamp(backward, LMIN, LMAX)));
        args.push(parseInt(clamp(left, LMIN, LMAX)));

        sendAction('V_leds_buttons', args);
    };


    /**
     * Lights the temperature sensor LEDs
     * @param {hot} number - Red LED value (0 to 32)
     * @param {cold} number - Blue LED value (0 to 32)
     */
    ext.V_leds_temperature = function(hot, cold) {
        if (DEBUG) {
            console.log("called V_leds_temperature " + hot + " " + cold);
        }

        var args = Array();
        args.push(parseInt(clamp(hot, LMIN, LMAX)));
        args.push(parseInt(clamp(cold, LMIN, LMAX)));

        sendAction('V_leds_temperature', args);
    };

    /**
    * Lights the sound sensor LED
    * @param {value} number -  sound LED value (0 to 32)
    */

    ext.V_leds_sound = function(value) {
        if (DEBUG) {
            console.log("called V_leds_sound " + value);
        }

        var args = Array();
        args.push(parseInt(clamp(value, LMIN, LMAX)));

        sendAction('V_leds_sound', args);
    };

    /**
     * Light the RC sensor LED
     * @param {value} number -  RC LED value (0 to 32)
     */
    ext.V_leds_rc = function(value) {
        if (DEBUG) {
            console.log("called V_leds_rc " + value);
        }

        var args = Array();
        args.push(parseInt(clamp(value, LMIN, LMAX)));

        sendAction('V_leds_rc', args);
    };
    
    
    /**
     * Lights the ground sensor LEDs
     * @param {fl} number -  front left value (0 to 32)
     * @param {flm} number -  front left value (0 to 32)
     * @param {flc} number -  front left value (0 to 32)
     * @param {frc} number -  front left value (0 to 32)
     * @param {frm} number -  front left value (0 to 32)
     * @param {fr} number -  front left value (0 to 32)
     * @param {br} number -  front left value (0 to 32)
     * @param {bl} number -  front left value (0 to 32)
     */
    ext.V_leds_prox_h = function(fl, flm,flc,frc,frm,fr,br,bl) {
        if (DEBUG) {
            console.log("called V_leds_prox_h " + fl+" "+flm+" "+flc+" "+frc+" "+frm+" "+fr+" "+br+" "+bl);
        }

        var args = Array();
        args.push(parseInt(clamp(fl, LMIN, LMAX)));
        args.push(parseInt(clamp(flm, LMIN, LMAX)));
		args.push(parseInt(clamp(flc, LMIN, LMAX)));
		args.push(parseInt(clamp(frc, LMIN, LMAX)));
		args.push(parseInt(clamp(frm, LMIN, LMAX)));
		args.push(parseInt(clamp(fr, LMIN, LMAX)));
		args.push(parseInt(clamp(br, LMIN, LMAX)));
		args.push(parseInt(clamp(bl, LMIN, LMAX)));
		
        sendAction('V_leds_prox_h', args);
    };


    /**
     * Lights the ground sensor LEDs
     * @param {left} number -  left ground sensor LED value (0 to 32)
     * @param {right} number -  right ground sensor LED value (0 to 32)
     */
    ext.V_leds_prox_v = function(left, right) {
        if (DEBUG) {
            console.log("called V_leds_prox_v " + left + " " + right);
        }

        var args = Array();
        args.push(parseInt(clamp(left, LMIN, LMAX)));
        args.push(parseInt(clamp(right, LMIN, LMAX)));

        sendAction('V_leds_prox_v', args);
    };

    /**
     * Set to 0 the intensity of top, bottom and circle LEDs
     */
    ext.scratch_clear_leds = function() {
        if (DEBUG) {
            console.log("called scratch_clear_leds");
        }

        var args = Array();
        for (i = 0; i < 8; i++) {
            args.push(0);
        }

        sendAction('V_leds_circle', args, function() {

            var args = Array();
            for (i = 0; i < 3; i++) {
                args.push(0);
            }
            sendAction('V_leds_top', args, function() {

                var args = Array();
                for (i = 0; i < 4; i++) {
                    args.push(0);
                }

                sendAction('V_leds_bottom', args, function() {

                    var args = Array();
                    args.push(1);
                    for (i = 0; i < 3; i++) {
                        args.push(0);
                    }
                    sendAction('V_leds_bottom', args, function() {

                    });
                });
            });
        });
    };

    /**
     * Returns a string of the values of the 2 lower sensors.
     */
    ext.prox_ground_delta = function() {
        if (DEBUG) {
            console.log("prox_ground_delta");
        }
        return cachedValues[15] + " " + cachedValues[16];

    };

    /**
     * Returns a string of the values of the 7 proximity sensors.
     */
    ext.prox_horizontal = function() {
        if (DEBUG) {
            console.log("prox_horizontal");
        }

        var value = cachedValues[17];

        for (i = 1; i < 7; i++) {
            value = value + " " + cachedValues[(17 + i)];
        }

        return value;
    };

    /**
     * Distance from an obstacle calculated from the given sensors (front, back, ground)
     * @param {sensor} string -  Item of 'sensors' menu.
     */
    ext.distance = function(sensor) {
        if (DEBUG) {
            console.log("distance " + sensor);
        }

        var num = parseInt(cachedValues[5]);

        if (sensor == menus[lang]['sensors'][0]) {
            var front = num & 0xff;
            return clamp(front, 0, 190);
        } else if (sensor == menus[lang]['sensors'][1]) {
            var back = ((num >> 8) & 0xff);
            return clamp(back, 0, 125);
        } else {
            var ground = parseInt(cachedValues[15]) + parseInt(cachedValues[16]);
            if (ground > 1000)
                return 0;
            else return 500;
        }

    };

    /**
     * Angle under which an obstacle is seen from the robot, calculated from the horizontal sensors of an obstacle.
     * @param {sensor} string -  Item of 'angles' menu.
     */
    ext.angle = function(sensor) {

        if (DEBUG) {
            console.log("angle " + sensor);
        }

        if (sensor == menus[lang]['sensors'][0]) {
            return parseInt(cachedValues[4]);
        } else {
            var num = parseInt(cachedValues[3]);
            var back = (num % 256) - 90;
            var ground = ((num >> 8) % 256) - 90;

            if (sensor == menus[lang]['sensors'][1])
                return back;
            else
                return ground;

        }

    };


    /**
     * Plays a note (Hz) for a time (s)
     * @param {freq} number -  freg in Hz
     * @param {duration} number -  duration in seconds
     */
    ext.A_sound_freq = function(freq, duration) {

        if (DEBUG) {
            console.log("A_sound_freq " + freq + " " + duration);
        }

        freq = parseInt(freq);
        duration = parseInt(parseFloat(duration) * 60);


        var args = Array();
        args.push(parseInt(freq));
        args.push(parseInt(duration));

        sendAction('A_sound_freq', args);

    };


    /**
     * Plays a system sound
     * @param {sound} number - system sound number
     */
    ext.A_sound_system = function(sound) {
        if (DEBUG) {
            console.log("A_sound_system " + sound);
        }

        sound = parseInt(sound);
        var args = Array();
        args.push(parseInt(sound));

        sendAction('A_sound_system', args);

    };



    /**
     * Sets the odometer
     * @param {theta} number - angle theta in degrees
     * @param {x} number - x coordinate
     * @param {y} number - y coordinate
     */
    ext.Q_set_odometer = function(theta, x, y) {
        if (DEBUG) {
            console.log("Q_set_odometer " + theta + " " + x + " " + y);
        }
        var args = Array();
        args.push(parseInt(theta));
        args.push(parseInt(x));
        args.push(parseInt(y));

        sendAction('Q_set_odometer', args);
    };

    /**
     * Returns a odometer value
     * @param {menu} string - Item of 'odo' menu
     */
    ext.odo = function(menu) {
        if (DEBUG) {
            console.log("odo " + menu);
        }
        if (menu == menus[lang]['odo'][0]) {
            return parseInt(cachedValues[10]);
        } else if (menu == menus[lang]['odo'][1]) {
            return parseInt(cachedValues[11] / 28);
        } else if (menu == menus[lang]['odo'][2]) {
            return parseInt(cachedValues[12] / 28);
        }
    };


 	ext.button = function(menu) {
        if (DEBUG) {
            console.log("button "+menu);
        }
        var num = parseInt(cachedValues[2]);
		
		if (menu == menus[lang]['buttons'][0]) {
			var center = parseInt((num >> 3) & 1);
			if(center==1) return true;
			else return false;
        } else if (menu == menus[lang]['buttons'][1]) {
			var forward = parseInt((num >> 2) & 1);
			if(forward==1) return true;
			else return false;
        } else if (menu == menus[lang]['buttons'][2]) {
			var backward = parseInt((num >> 4) & 1);
			if(backward==1) return true;
			else return false;
        } else if (menu == menus[lang]['buttons'][3]) {
			var left = parseInt((num >> 1) & 1);
			if(left==1) return true;
			else return false;
        } else if (menu == menus[lang]['buttons'][4]) {
			var right = parseInt((num ) & 1);
			if(right==1) return true;
			else return false;
        } 
       return false;
    };


    /**
     * Returns the value of the microphone intensity
     */
    ext.mic_intensity = function() {
        if (DEBUG) {
            console.log("mic_intensity ");
        }
        var num = parseInt(cachedValues[2]);

        var intensity = parseInt(((num >> 8) % 8));
        return intensity;
    };

    /**
     * Returns the value of prox.comm.rx
     */
    ext.receive = function() {
        if (DEBUG) {
            console.log("called receive");
        }
        var num = parseInt(cachedValues[13]);
        return num;
    };

    /**
     * Returns true if a sound is detected
     */
    ext.sound_detected = function() {
        if (DEBUG) {
            console.log("sound_detected ");
        }
        var num = parseInt(cachedValues[2]);

        var intensity = parseInt(((num >> 8) % 8));
        if (intensity > 2) return true;
        else return false;
    };

    /*  ext.motor_target = function(menu) {
        if (DEBUG) {
            console.log("motor_target ");
        }
        if (menu == menus[lang]['leftright'][0])
            return parseInt(cachedValues[6] / 32 * 10);
        else if (menu == menus[lang]['leftright'][1])
            return parseInt(cachedValues[7] / 32 * 10);
    };
    ext.motor_speed = function(menu) {
        if (DEBUG) {
            console.log("motor_speed " + menu);
        }
        if (menu == menus[lang]['leftright'][0])
            return parseInt(cachedValues[8] / 32 * 10);
        else if (menu == menus[lang]['leftright'][1])
            return parseInt(cachedValues[9] / 32 * 10);
    };
*/

    /**
     * Returns the value of motor (left or right) in Adeba unities.
     * @param {menu} string - Item of 'leftright' menu
     */
    ext.motor = function(menu) {

        if (DEBUG) {
            console.log("motor " + menu);
        }
        if (menu == menus[lang]['leftright'][0])
            return parseInt(cachedValues[8]);
        else if (menu == menus[lang]['leftright'][1])
            return parseInt(cachedValues[9]);

    };

    /**
     * Returns the accelerometer value along a given axis (left-right, top-to-bottom, front-to-back).
     * @param {menu} string - Item of 'tilts' menu
     */
    ext.tilt = function(menu) {
        if (DEBUG) {
            console.log("tilt " + menu);
        }

        var num = cachedValues[1];
        if (menu == menus[lang]['tilts'][2]) {
            return (((num >> 10) % 32) - 16) * 2;
        } else if (menu == menus[lang]['tilts'][0]) {
            return (((num >> 5) % 32) - 16) * 2;
        } else if (menu == menus[lang]['tilts'][1]) {
            return ((num % 32) - 16) * 2;
        } else {
            return 0;
        }

    };


    /**
     * Returns true if the average value of the three axes of the accelerometer is more than the given value
     * @param {value} number - threshold
     */
    ext.bump = function(value) {
        if (DEBUG) {
            console.log("bump ");
        }

        value = parseInt(value);
        var num = cachedValues[1];
        var acc0 = (((num >> 10) % 32) - 16) * 2
        var acc1 = (((num >> 5) % 32) - 16) * 2;
        var acc2 = ((num % 32) - 16) * 2
        var ave = (acc0 + acc1 + acc2) / 3;
        if (parseInt(ave) > value) {
            return true;
        } else {
            return false;
        }

    };

    /**
     * Plays a sound from the SD
     * @param {sound} number - slot SD sound number
     */
    ext.A_sound_play_sd = function(sound) {
        if (DEBUG) {
            console.log("A_sound_play_sd " + sound);
        }

        var args = Array();
        args.push(parseInt(sound));

        sendAction('A_sound_play', args);

    };

    /**
     * Starts or stops recording
     * @param {sound} number - recorded sound number
     */
    ext.A_sound_record = function(sound) {
        if (DEBUG) {
            console.log("A_sound_record " + sound);
        }


        var args = Array();
        args.push(parseInt(sound));

        sendAction('A_sound_record', args);

    };

    /**
     * Plays a recorded sound
     * @param {sound} number - recorded sound number
     */
    ext.A_sound_replay = function(sound) {
        if (DEBUG) {
            console.log("A_sound_replay " + sound);
        }

        var args = Array();
        args.push(parseInt(sound));

        sendAction('A_sound_replay', args);

    };

    /**
     * Returns true if an object is detected by a given sensor.
     * @param {sound} number - Item of 'sensors' menu.
     */
    ext.touching = function(sensor) {
        if (DEBUG) {
            console.log("touching " + sensor);
        }

        if (sensor == menus[lang]['sensors'][0]) { //front
            var value = 0;
            for (i = 0; i < 5; i++) {
                value = value + parseInt(cachedValues[17 + i]);
            }
            if (value / 1000 > 0) {
                return true;
            } else {
                return false;
            }
        } else if (sensor == menus[lang]['sensors'][1]) { //back
            var value = parseInt(cachedValues[22]) + parseInt(cachedValues[23]);

            if (value / 1000 > 0) {
                return true;
            } else {
                return false;
            }
        } else { //ground
            var value = parseInt(cachedValues[15]) + parseInt(cachedValues[16]);

            if (value / 500 > 0) {
                return true;
            } else {
                return false;
            }
        }

    };

    /**
     * Returns true if a given proximity sensor is greater than a  threshold
     * @param {sound} number - Item of 'sensors' menu.
     * @param {threshold} number - threshold
     */
    ext.touching_threshold = function(sensor, threshold) {
        if (DEBUG) {
            console.log("touching " + sensor);
        }
        threshold = parseInt(threshold);
        if (sensor == menus[lang]['sensors'][0]) { //front

            for (i = 0; i < 5; i++) {
                if (parseInt(cachedValues[17 + i])>threshold) return true;
            }
            return false;
        } else if (sensor == menus[lang]['sensors'][1]) { //back
            if (parseInt(cachedValues[22]) > threshold || parseInt(cachedValues[22]) > threshold) {
                return true;
            }

            return false;

        } else { //ground
            if (parseInt(cachedValues[15]) > threshold || parseInt(cachedValues[16]) > threshold) {
                return true;
            }


            return false;

        }

    };




    // Check for GET param 'lang'
    var paramString = window.location.search.replace(/^\?|\/$/g, '');
    var vars = paramString.split("&");
    var lang = 'fr';
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (pair.length > 1 && pair[0] == 'lang')
            lang = pair[1];
    }

    var blocks = {
        en: [
            [" ", "motor %m.leftrightall %n", "scratch_motor", "left", 50],
            [" ", "stop motors", "scratch_stop"],
            ["w", "move %n", "scratch_move", 50],
            ["w", "move %n with speed %n", "scratch_move_with_speed", 50, 50],
            ["w", "move %n in %n s", "scratch_move_with_time", 50, 1],
            ["w", "turn %n", "scratch_turn", 45],
            ["w", "turn %n with speed %n", "scratch_turn_with_speed", 90,50],
            ["w", "turn %n in %n s", "scratch_turn_with_time", 90,1],
            ["w", "circle radius %n angle %n", "scratch_arc", 150, 45],
            [" ", "leds RGB %m.light %n %n %n", "scratch_leds", "all", 0, 0, 32],
            [" ", "leds set color %n on %m.light", "scratch_set_leds", 0, "all"],
            [" ", "leds change color %n on %m.light", "scratch_change_leds", 0, "all"],
            [" ", "leds next dial %m.leftright", "scratch_next_dial", "left"],
            [" ", "leds dial all %n %n %n %n %n %n %n %n", "V_leds_circle", 0, 8, 16, 32, 0, 8, 16, 32],
            [" ", "leds sensors h %n %n %n %n %n %n %n %n", "V_leds_prox_h", 0, 16, 32, 32, 16, 0, 32, 32],
            [" ", "leds sensors v %n %n", "V_leds_prox_v", 32, 32],
            [" ", "leds buttons %n %n %n %n", "V_leds_buttons", 16, 32, 16, 32],
            [" ", "leds temperature %n %n", "V_leds_temperature", 32, 8],
            [" ", "leds rc %n", "V_leds_rc", 16],
            [" ", "leds sound %n", "V_leds_sound", 32],
            [" ", "leds clear", "scratch_clear_leds"],
            [" ", "play system sound %m.sounds", "A_sound_system", 1],
            [" ", "play note %n during %n s", "A_sound_freq", 440, 1],
            [" ", "play sound SD %n", "A_sound_play_sd", ""],
            [" ", "record sound %n", "A_sound_record", ""],
            [" ", "replay sound %n", "A_sound_replay", ""],
            ["r", "proximity sensor %n", "proximity", 2],
            ["r", "proximity sensor %m.proxsensors", "proximity2", "front far left"],
            ["r", "proximity sensors", "prox_horizontal"],
            ["r", "ground sensor %n", "ground", 0],
            ["r", "ground sensors", "prox_ground_delta"],
            ["r", "distance %m.sensors", "distance", "front"],
            ["r", "angle %m.angles", "angle", "front"],
            ["b", "objet détecté %m.sensors", "touching", "devant"],
            ["b", "objet détecté %m.sensors %n", "touching_threshold", "devant"],
            ["r", "sound level", "mic_intensity"],
            ["b", "sound detected", "sound_detected"],
            ["b", "tap %n", "bump"],
            ["r", "tilt on %m.tilts", "tilt", "front-back"],
            ["R", "temperature", "temperature"],
            ["r", "measure motor %m.leftright", "motor", "left"],
            ["r", "leds color %m.light", "leds", "top"],    
            [" ", "set odometer %n %n %n", "Q_set_odometer", 90, 0, 0],
            ["r", "odometer %m.odo", "odo", "direction"],
            [" ", "emit %n", "emit", 1],
            ["r", "receive", "receive"],
            ["h", "button %m.buttons", "button","center"]
            
           /* 
            ["r", "motor %m.leftright speed", "motor_speed", "left" ],
            ["r", "motor %m.leftright target", "motor_target", "left" ],
            */
            ],
        fr: [
            [" ", "moteur %m.leftrightall %n", "scratch_motor", "gauche", 50],
            [" ", "stop moteurs", "scratch_stop"],
            ["w", "avancer %n", "scratch_move", 50],
            ["w", "avancer %n avec vitesse %n", "scratch_move_with_speed", 50, 50],
            ["w", "avancer %n en %n s", "scratch_move_with_time", 50, 1],
            ["w", "tourner %n", "scratch_turn", 45],
            ["w", "tourner %n avec vitesse %n", "scratch_turn_with_speed", 90,50],
            ["w", "tourner %n en %n s", "scratch_turn_with_time", 90,1],
            ["w", "cercle rayon %n angle %n", "scratch_arc", 150, 45],
            [" ", "leds RVB %m.light %n %n %n", "scratch_leds", "tout", 0, 0, 32],
            [" ", "leds fixer couleur %n on %m.light", "scratch_set_leds", 0, "tout"],
            [" ", "leds changer couleur %n pour %m.light", "scratch_change_leds", 0, "all"],
            [" ", "led cadran suivante %m.leftright", "scratch_next_dial", "gauche"],
            [" ", "leds cadran toutes %n %n %n %n %n %n %n %n", "V_leds_circle", 0, 8, 16, 32, 0, 8, 16, 32],
            [" ", "leds capteurs horiz. %n %n %n %n %n %n %n %n", "V_leds_prox_h", 0, 16, 32, 32, 16, 0, 32, 32],
            [" ", "leds capteurs dessous %n %n", "V_leds_prox_v", 32, 32],
            [" ", "leds boutons %n %n %n %n", "V_leds_buttons", 16, 32, 16, 32],
            [" ", "leds temperature %n %n", "V_leds_temperature", 32, 8],
            [" ", "leds rc %n", "V_leds_rc", 16],
            [" ", "leds sound %n", "V_leds_sound", 32],
            [" ", "éteindre leds", "scratch_clear_leds"],
            [" ", "jouer son système %m.sounds", "A_sound_system", 1],
            [" ", "jouer note %n pendant %n s", "A_sound_freq", 440, 1],
            [" ", "jouer son SD %n", "A_sound_play_sd", ""],
            [" ", "enregistrer son %n", "A_sound_record", ""],
            [" ", "rejouer son %n", "A_sound_replay", ""],
            ["r", "capteur horizontal %n", "proximity", 2],
            ["r", "capteur horizontal %m.proxsensors", "proximity2", "devant extrême gauche"],
            ["r", "capteurs horizontaux", "prox_horizontal"],
            ["r", "capteur dessous %n", "ground", 0],
            ["r", "capteurs dessous", "prox_ground_delta"],
            ["r", "distance %m.sensors", "distance", "devant"],
            ["r", "angle %m.angles", "angle", "devant"],
            ["b", "objet détecté %m.sensors", "touching", "devant"],
            ["b", "objet détecté %m.sensors %n", "touching_threshold", "devant"],
            ["r", "niveau sonore", "mic_intensity"],
            ["b", "bruit", "sound_detected"],
            ["b", "choc %n", "bump"],
            ["r", "inclinaison %m.tilts", "tilt", "devant-derrière"],
            ["R", "température", "temperature"],
            ["r", "mesure moteur %m.leftright", "motor", "gauche"],
            ["r", "leds couleur %m.singlelight", "leds", "dessus"],
            [" ", "odomètre %n %n %n", "Q_set_odometer", 90, 0, 0],
            ["r", "odomètre %m.odo", "odo", "direction"],
            [" ", "emission %n", "emit", 1],
            ["r", "reception", "receive"],
            ["h", "bouton %m.buttons", "button","central"]
            /*
            ["r", "moteur %m.leftright vitesse", "motor_speed", "gauche" ],
            ["r", "moteur %m.leftright target", "motor_target", "gauche" ],
            */
        ],
        it: [
            [" ", "motori %m.leftrightall %n", "scratch_motor", "gauche", 50],
            [" ", "ferma motori", "scratch_stop"],
            ["w", "avanza di %n", "scratch_move", 50],
            ["w", "avanza di %n con velocità %n", "scratch_move_with_speed", 50, 50],
            ["w", "avanza di %n in %n s", "scratch_move_with_time", 50, 1],
            ["w", "ruota di %n gradi", "scratch_turn", 45],
            ["w", "ruota di %n gradi con velocità %n", "scratch_turn_with_speed", 90,50],
            ["w", "ruota di %n gradi in %n s", "scratch_turn_with_time", 90,1],
            ["w", "fai un cerchio di raggio %n per %n gradi", "scratch_arc", 150, 45],
            [" ", "tutti i LED RVB %m.light %n %n %n", "scratch_leds", "tutti", 0, 0, 32],
            [" ", "colora LED %n %m.light", "scratch_set_leds", 0, "tutti"],
            [" ", "cambia colore LED %n %m.light", "scratch_change_leds", 0, "tutti"],
            [" ", "on LED quadrante %m.leftright", "scratch_next_dial", "sinistro"],
            [" ", "on LED quadrante %n %n %n %n %n %n %n %n", "V_leds_circle", 0, 8, 16, 32, 0, 8, 16, 32],
            [" ", "LED sensori prox. %n %n %n %n %n %n %n %n", "V_leds_prox_h", 0, 16, 32, 32, 16, 0, 32, 32],
            [" ", "LED sensori terreno %n %n", "V_leds_prox_v", 32, 32],
            [" ", "LED bottoni %n %n %n %n", "V_leds_buttons", 16, 32, 16, 32],
            [" ", "LED temperatura %n %n", "V_leds_temperature", 32, 8],
            [" ", "LED RC %n", "V_leds_rc", 16],
            [" ", "LED microfono %n", "V_leds_sound", 32],
            [" ", "spegni LED", "scratch_clear_leds"],
            [" ", "suona suono Thymio %m.sounds", "A_sound_system", 1],
            [" ", "suona nota %n per %n s", "A_sound_freq", 440, 1],
            [" ", "suona suono su scheda SD %n", "A_sound_play_sd", ""],
            [" ", "registra suono %n", "A_sound_record", ""],
            [" ", "riproduci suono %n", "A_sound_replay", ""],
            ["r", "sensore prox.%n", "proximity", 2],
            ["r", "sensore prox. %m.proxsensors", "proximity2", "tutto a sinistra"],
            ["r", "sensori di prox. oriz.", "prox_horizontal"],
            ["r", "sensore terreno %n", "ground", 0],
            ["r", "sensori di prox. terreno", "prox_ground_delta"],
            ["r", "distanza %m.sensors", "distance", "davanti"],
            ["r", "angolo %m.angles", "angle", "davanti"],
            ["b", "oggetto rilevato %m.sensors", "touching", "davanti"],
            ["b", "oggetto rilevato %m.sensors %n", "touching_threshold", "davanti"],
            ["r", "livello sonoro", "mic_intensity"],
            ["b", "rumore captato", "sound_detected"],
            ["b", "urto %n", "bump"],
            ["r", "inclinazione %m.tilts", "tilt", "davanti-dietro"],
            ["R", "temperatura", "temperature"],
            ["r", "misura motori %m.leftright", "motor", "sinistro"],
            ["r", "colore LED %m.singlelight", "leds", "sopra"],
            [" ", "inizializza isometria %n %n %n", "Q_set_odometer", 90, 0, 0],
            ["r", "isometria %m.odo", "odo", "direzione"],
            [" ", "emetti %n", "emit", 1],
            ["r", "ricezione", "receive"],
            ["h", "bottone %m.buttons", "button","centrale"]
            
            /* 
            ["r", "moteur %m.leftright vitesse", "motor_speed", "gauche" ],
            ["r", "moteur %m.leftright target", "motor_target", "gauche" ],
            */
            
        ]
    };

    var menus = {
        en: {
            leftrightall: ["left", "right", "all"],
            leftright: ["left", "right"],
            sensors: ["front", "back", "ground"],
            proxsensors: ["front far left", "front left", "front center", "front right", "front far right", "back left", "back right"],
            singlelight: ["top", "bottom-left", "bottom-right"],
            light: ["all", "top", "bottom", "bottom-left", "bottom-right"],
            angles: ["front", "back", "ground"],
            sounds: ["0", "1", "2", "3", "4", "5", "6", "7"],
            odo: ["direction", "x", "y"],
            tilts: ["front-back", "top-bottom", "left-right"],
            buttons: ["center","front","back","left","right"]

        },
        fr: {
            leftrightall: ["gauche", "droite", "tous"],
            leftright: ["gauche", "droite"],
            sensors: ["devant", "derrière", "dessous"],
            proxsensors: ["devant extrême gauche", "devant gauche", "devant centre", "devant droite", "devant extrême droite", "derrière gauche", "derrière droite"],
            singlelight: ["dessus", "dessous gauche", "dessous droite"],
            light: ["tout", "dessus", "dessous", "dessous gauche", "dessous droite"],
            angles: ["devant", "derrière", "dessous"],
            sounds: ["0", "1", "2", "3", "4", "5", "6", "7"],
            odo: ["direction", "x", "y"],
            tilts: ["devant-derrière", "dessus-dessous", "gauche-droite à plat"],
            buttons: ["central","devant","derrière", "gauche", "droite"]

        },
        it: {
            leftrightall: ["sinistro", "destro", "tutti"],
            leftright: ["sinistro", "destro"],
            sensors: ["davanti", "dietro", "terreno"],
            proxsensors: ["tutto a sinistra", "a sinistra", "centrale", "a destra", "tutto a destra", "posteriore sinistro", "posteriore destro" ],
            singlelight: ["sopra", "sotto a sinistra", "sotto a destra"],
            light: ["tutti", "superiori", "inferiori", "inferiori a sinistra", "inferiori a destra"],
            angles: ["davanti", "dietro", "terreno"],
            sounds: ["0", "1", "2", "3", "4", "5", "6", "7"],
            odo: ["direzione", "x", "y"],
            tilts: ["davanti-dietro", "sopra-sotto", "sinistro-destro"],
            buttons: ["centrale","davanti","dietro","sinistra","destra"]

        }

    };

    var descriptor = {
        blocks: blocks[lang],
        menus: menus[lang]
           
    };

    // Register the extension
    ScratchExtensions.register('Thymio', descriptor, ext);


    //Utilities

    function clamp(val, min, max) {
        return val = (val < min ? min : (val > max ? max : val));
    }

    /**
     * The function send a Request to thymio-II REST API. It is used by command blocks that wait.
     * @param {array} args - arguments to send
     * @param {number} method - method type (1-GET,2-POST,3-PUT)
     * @param {function} callback - callback function
     */
    function requestSend(args, method, callback) {

        switch (method) {
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
        url = ASEBAHTTPURL + 'nodes/thymio-II/' + args[0];

        var req = new XMLHttpRequest();
        if (!req) {
            return;
        }
        req.open(method, url, true);
        req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        req.onreadystatechange = function() {
            if (req.readyState != 4) {
                return;
            }
            callback(req);
        };
        if (req.readyState == 4) {
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

    };


    function sendAction(action, args, callback) {

        var params = args.join("/")
        $.ajax({
            url: ASEBAHTTPURL + 'nodes/thymio-II/' + action + '/' + params,
            dataType: 'json',
            success: function(data) {

                if (DEBUG) {
                    console.log("send: " + ASEBAHTTPURL + 'nodes/thymio-II/' + action + '/' + params);
                }

                if (typeof callback == 'function') {
                    if (DEBUG) {
                        console.log("call callback");
                    }
                    callback(data);
                } else {
                    if (DEBUG) {
                        console.log("NO call callback");
                    }
                }


            }
        });

    }


    function makeLedsRGBVector(color) {

        var rgb = [];
        switch (parseInt(color / 33)) {
            case 0:
                rgb[0] = 33;
                rgb[1] = color % 33;
                rgb[2] = 0;
                break;
            case 1:
                rgb[0] = 33 - color % 33;
                rgb[1] = 33;
                rgb[2] = 0;
                break;
            case 2:
                rgb[0] = 0;
                rgb[1] = 33;
                rgb[2] = color % 33;
                break;
            case 3:
                rgb[0] = 0;
                rgb[1] = 33 - color % 33;
                rgb[2] = 33;
                break;
            case 4:
                rgb[0] = color % 33;
                rgb[1] = 0;
                rgb[2] = 33;
                break;
            case 5:
                rgb[0] = 33;
                rgb[1] = 0;
                rgb[2] = 33 - color % 33;
                break;
        }
        
        return rgb;
    }



})({});
