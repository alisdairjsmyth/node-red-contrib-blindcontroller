/**
 * Copyright 2015, 2016 Alisdair Smyth
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
module.exports = function(RED) {
    "use strict";

    /*
     * Tests the validity of the input msg.payload before using this payload to
     * run the calculation.  As the node consumes 4 different message type, the
     * topic is used as the mechanism of identifying the type.  The validations
     * differ for each message type.
     *
     * The validations performed are:
     * - existence of mandatory properties e.g. channel must exist
     * - range checks on property values e.g. orientation should be a value
     *   between 0 and 360 inclusive
     * - consistency checks between property values e.g. bottom of window should
     *   be higher than the top
     */
    function validateMsg(node, msg) {
        var validMsg = true;

        if (!(typeof msg.payload === "object")) {
            node.error(RED._("blindcontroller.error.invalid-msg-payload"), msg);
            validMsg = false;
        } else {
            switch (msg.topic) {
                case "sun":
                    validMsg = validateSunPositionMsg (node, msg);
                    break;
                case "blindPosition":
                    validMsg = validateBlindPositionMsg (node, msg);
                    break;
                case "blind":
                    validMsg = validateBlindMsg (node, msg);
                    break;
                case "weather":
                    validMsg = validateWeatherMsg (node, msg);
                    break;
                default:
                    node.error(RED._("blindcontroller.error.unknown-msg-topic")+ msg.topic, msg);
                    validMsg = false;
            }
        }
        return validMsg;
    }

    /*
     * Validate Sun Position message
     */
    function validateSunPositionMsg (node, msg) {
        var validMsg = true;
        var sunProperty = [
            "sunInSky",
            "azimuth",
            "altitude"
        ];
        var i;

        for (i in sunProperty) {
            if (!(sunProperty[i] in msg.payload)) {
                node.error(RED._("blindcontroller.error.sunPosition.missing-property") + sunProperty[i], msg);
                validMsg = false;
            }
        }
        if (validMsg) {
            if (typeof msg.payload.sunInSky != "boolean") {
                node.error(RED._("blindcontroller.error.sunPosition.invalid-sunInSky")+ typeof msg.payload.sunInSky, msg);
                validMsg = false;
            }
            if ((typeof msg.payload.altitude != "number") ||
                (msg.payload.altitude > 90)) {
                node.error(RED._("blindcontroller.error.sunPosition.invalid-altitude")+ msg.payload.altitude, msg);
                validMsg = false;
            }
            if ((typeof msg.payload.azimuth != "number") ||
                (msg.payload.azimuth < 0) ||
                (msg.payload.azimuth > 360)) {
                node.error(RED._("blindcontroller.error.sunPosition.invalid-azimuth")+ msg.payload.azimuth, msg);
                validMsg = false;
            }
        }
        return validMsg;
    }

    /*
     * Validate Blind message
     */
    function validateBlindMsg (node, msg) {
        var validMsg = true;
        var blindProperty = [
            "channel",
            "orientation",
            "top",
            "bottom",
            "depth",
            "increment"
        ];
        var modes = [
            "Summer",
            "Winter"
        ];
        var i;

        for (i in blindProperty) {
            if (!(blindProperty[i] in msg.payload)) {
                node.error(RED._("blindcontroller.error.blind.missing-property") + blindProperty[i], msg);
                validMsg = false;
            }
        }
        if (validMsg) {
            if ((typeof msg.payload.orientation != "number") ||
                (msg.payload.orientation < 0) ||
                (msg.payload.orientation > 360)) {
                    node.error(RED._("blindcontroller.error.blind.invalid-orientation") + msg.payload.orientation, msg);
                    validMsg = false;
            }
            if ((msg.payload.mode) &&
               ((typeof msg.payload.mode != "string") ||
                (modes.indexOf(msg.payload.mode) == -1))) {
                    node.error(RED._("blindcontroller.error.blind.invalid-mode") + msg.payload.mode, msg);
                    validMsg = false;
            }
            if ((msg.payload.noffset) &&
               ((typeof msg.payload.noffset != "number") ||
                (msg.payload.noffset < 0) ||
                (msg.payload.noffset > 90))) {
                    node.error(RED._("blindcontroller.error.blind.invalid-noffset") + msg.payload.noffset, msg);
                    validMsg = false;
            }
            if ((msg.payload.poffset) &&
               ((typeof msg.payload.poffset != "number") ||
                (msg.payload.poffset < 0) ||
                (msg.payload.poffset > 90))) {
                    node.error(RED._("blindcontroller.error.blind.invalid-poffset") + msg.payload.poffset, msg);
                    validMsg = false;
            }
            if ((typeof msg.payload.top != "number") ||
                (msg.payload.top <= 0)) {
                    node.error(RED._("blindcontroller.error.blind.invalid-top") + msg.payload.top, msg);
                    validMsg = false;
            }
            if ((typeof msg.payload.bottom != "number") ||
                (msg.payload.bottom < 0)) {
                    node.error(RED._("blindcontroller.error.blind.invalid-bottom") + msg.payload.bottom, msg);
                    validMsg = false;
            }
            if ((typeof msg.payload.depth != "number") ||
                (msg.payload.depth < 0)) {
                    node.error(RED._("blindcontroller.error.blind.invalid-depth") + msg.payload.depth, msg);
                    validMsg = false;
            }
            if ((typeof msg.payload.top == "number") &&
                (typeof msg.payload.bottom == "number") &&
                (msg.payload.top < msg.payload.bottom)) {
                node.error(RED._("blindcontroller.error.blind.invalid-dimensions") + msg.payload.top + " - " + msg.payload.bottom, msg);
                validMsg = false;
            }
            if ((typeof msg.payload.increment != "number") ||
                (msg.payload.increment < 0) ||
                (msg.payload.increment > 100) ||
                (100%msg.payload.increment != 0)) {
                node.error(RED._("blindcontroller.error.blind.invalid-increment") + msg.payload.increment, msg);
                validMsg = false;
            }
            if ((msg.payload.maxopen) &&
                ((typeof msg.payload.maxopen != "number") ||
                 (msg.payload.maxopen < 0) ||
                 (msg.payload.maxopen > 100) ||
                 (msg.payload.maxopen%msg.payload.increment != 0))) {
                node.error(RED._("blindcontroller.error.blind.invalid-maxopen") + msg.payload.maxopen, msg);
                validMsg = false;
            }
            if ((msg.payload.maxclosed) &&
                ((typeof msg.payload.maxclosed != "number") ||
                 (msg.payload.maxclosed < 0) ||
                 (msg.payload.maxclosed > 100) ||
                 (msg.payload.maxclosed%msg.payload.increment != 0))) {
                node.error(RED._("blindcontroller.error.blind.invalid-maxclosed") + msg.payload.maxclosed, msg);
                validMsg = false;
            }
            if ((msg.payload.maxopen > msg.payload.maxclosed)) {
                node.error(RED._("blindcontroller.error.blind.invalid-max-settings") + msg.payload.maxopen + " - " + msg.payload.maxclosed, msg);
                validMsg = false;
            }
            if ((msg.payload.altitudethreshold) &&
                ((typeof msg.payload.altitudethreshold != "number") ||
                 (msg.payload.altitudethreshold < 0) ||
                 (msg.payload.altitudethreshold > 90))) {
                node.error(RED._("blindcontroller.error.blind.invalid-altitudethreshold") + msg.payload.altitudethreshold, msg);
                validMsg = false;
            }
            if ((msg.payload.cloudsthreshold) &&
                ((typeof msg.payload.cloudsthreshold != "number") ||
                 (msg.payload.cloudsthreshold < 0) ||
                 (msg.payload.cloudsthreshold > 1))) {
                node.error(RED._("blindcontroller.error.blind.invalid-cloudsthreshold") + msg.payload.cloudsthreshold, msg);
                validMsg = false;
            }
            if ((msg.payload.nightposition) &&
                ((typeof msg.payload.nightposition != "number") ||
                 (msg.payload.nightposition < 0) ||
                 (msg.payload.nightposition > 100) ||
                 (msg.payload.nightposition%msg.payload.increment != 0))) {
                node.error(RED._("blindcontroller.error.blind.invalid-nightposition") + msg.payload.nightposition, msg);
                validMsg = false;
            }
            if ((msg.payload.expiryperiod) &&
                ((typeof msg.payload.expiryperiod != "number") ||
                 (msg.payload.expiryposition < 0))) {
                     node.error(RED._("blindcontroller.error.blind.invalid-expiryperiod") + msg.payload.expiryperiod, msg);
                     validMsg = false;
            }
        }
        return validMsg;
    }

    /*
     * Validate Blind Position message
     */
    function validateBlindPositionMsg (node, msg) {
        var validMsg = true;
        var blindProperty = [
            "channel",
            "blindPosition"
        ];
        var i;

        for (i in blindProperty) {
            if (!(blindProperty[i] in msg.payload)) {
                node.error(RED._("blindcontroller.error.blindPosition.missing-property") + blindProperty[i], msg);
                validMsg = false;
            }
        }
        if (validMsg) {
            if ((typeof msg.payload.blindPosition != "number") ||
                (msg.payload.blindPosition < 0) ||
                (msg.payload.blindPosition > 100)) {
                node.error(RED._("blindcontroller.error.blindPosition.invalid-blindPosition") + msg.payload.blindPosition, msg);
                validMsg = false;
            }
        }
        return validMsg;
    }

    /*
     * Validate Weather message
     */
    function validateWeatherMsg (node, msg) {
        var validMsg = true;
        if ((msg.payload.clouds < 0) || (msg.payload.clouds > 1)) {
            node.error(RED._("blindcontroller.error.weather.invalid-clouds") + msg.payload.clouds, msg);
            validMsg = false;
        }
        return validMsg;
    }

    /*
     * Function to determine whether the sun is considered to be in the window
     * based on the orientation of the window and the azimuth of the sun
     */
    function isSunInWindow(blind, azimuth) {
        var sunInWindow = false;

        /*
         * Checks the sun azimuth is between window orientation +/- offset.
         * Where the range includes ranges each side of north, separate checks
         * need to be performed either side of north
         */
        if (blind.orientation - blind.noffset < 0) {
            if ((((360 + blind.orientation - blind.noffset) <= azimuth) & (azimuth <= 360)) ||
                ((0 <= azimuth) && (azimuth <= blind.orientation + blind.poffset))) {
                sunInWindow = true;
            }
        } else if (blind.orientation + blind.poffset > 360) {
            if (((0 <= azimuth) & (azimuth <= (blind.orientation + blind.poffset - 360))) ||
                (((blind.orientation - blind.noffset) <= azimuth) && (azimuth <= 360))) {
                sunInWindow = true;
            }
        } else {
            if (((blind.orientation - blind.noffset) <= azimuth) && (azimuth <= (blind.orientation + blind.poffset))) {
                sunInWindow = true;
            }
        }
        return sunInWindow;
    }

    /*
     * Function to calculate the appropriate blind position based on the
     * altitude of the sun, characteristics of the window, with the target of
     * restricting or maximising the extent to which direct sunlight enters
     * the room.
     *
     * The function works in two modes, Summer and Winter.  In Summer mode, it
     * restricts direct sunlight entering the room.  When the sun is considered
     * to be in the window, the function calculates the minimum height of an
     * object that casts a shadow to the depth property based on the sun
     * altitude of the sun.  This height is converted into a blind position
     * using the dimensions of the window and the increments by which the blind
     * position can be controlled.
     *
     * The calculation also takes into account the following (in order of
     * precedence):
     * - if the blind's position has been manually specified, the calculation
     *   is not performed for that blind until that position expires
     * - if the forecasted temperature for the day exceeds a threshold, the
     *   blind will be closed fully while the sun is in the sky.  This feature
     *   of the function is intended to allow blinds to be used to block out
     *   extreme heat.
     * - if it is deemed to be sufficiently overcast, the blind will be set to a
     *   fully open position.
     * - if the sun is below an altitude threshold, the blind will be set to a
     *   fully open position.
     *
     * In winter mode, the calculation is simply based on whether the sun is in
     * window.  If the sun is in the window, it will be opened to a configured
     * Open position.  If the sun is not in the window, it is closed to a
     * configured Closed position.
     *
     * Outside daylight hours, the blind is closed to a configured position.
     */
    function calcBlindPosition (blind, sunPosition, weather) {
        /*
         * For the given altitude of the sun, calculate the minimum height of
         * an object that casts a shadow to the specified depth. Convert this
         * height into a blind position based on the dimensions of the window
         */
        var isTemperatureAConcern = ((weather.maxtemp) && (blind.temperaturethreshold)) ? (weather.maxtemp > blind.temperaturethreshold) : false;
        var isOvercast = ((weather.clouds) && (blind.cloudsthreshold)) ? (weather.clouds > blind.cloudsthreshold) : false;
        var now = new Date();

        if (hasBlindPositionExpired(blind.blindPositionExpiry)) {
            blind.blindPosition         = blind.maxopen;
            if (sunPosition.sunInSky) {
                if (isTemperatureAConcern) {
                    blind.blindPosition = blind.maxclosed;
                    blind.blindPositionReasonCode = "07";
                    blind.blindPositionReasonDesc = RED._("blindcontroller.positionReason.07");
                } else {
                    blind.sunInWindow = isSunInWindow(blind, sunPosition.azimuth);
                    switch (blind.mode) {
                        case "Winter":
                            if (blind.sunInWindow) {
                                blind.blindPosition           = blind.maxopen;
                                blind.blindPositionReasonCode = "05";
                                blind.blindPositionReasonDesc = RED._("blindcontroller.positionReason.05");
                            } else {
                                blind.blindPosition           = blind.maxclosed;
                                blind.blindPositionReasonCode = "04";
                                blind.blindPositionReasonDesc = RED._("blindcontroller.positionReason.04");;
                            }
                            break;
                        default:
                            if (blind.sunInWindow) {
                                if (((blind.altitudethreshold) && sunPosition.altitude >= blind.altitudethreshold ||
                                     (!blind.altitudeThreshold)) &&
                                     !isOvercast) {
                                    var height = Math.tan(sunPosition.altitude*Math.PI/180) * blind.depth;
                                    if (height <= blind.bottom) {
                                        blind.blindPosition = blind.maxclosed;
                                    } else if (height >= blind.top) {
                                        blind.blindPosition = blind.maxopen;
                                    } else {
                                        blind.blindPosition = Math.ceil(100 * (1 - (height - blind.bottom) / (blind.top - blind.bottom)));
                                        blind.blindPosition = Math.ceil(blind.blindPosition / blind.increment) * blind.increment;
                                        blind.blindPosition = (blind.blindPosition > blind.maxclosed) ? blind.maxclosed : blind.blindPosition;
                                        blind.blindPosition = (blind.blindPosition < blind.maxopen) ? blind.maxopen : blind.blindPosition;
                                    }
                                    blind.blindPositionReasonCode = "05";
                                    blind.blindPositionReasonDesc = RED._("blindcontroller.positionReason.05");
                                } else if ((blind.altitudethreshold) && sunPosition.altitude < blind.altitudethreshold){
                                    blind.blindPositionReasonCode = "03";
                                    blind.blindPositionReasonDesc = RED._("blindcontroller.positionReason.03");
                                } else if (isOvercast) {
                                    blind.blindPositionReasonCode = "06";
                                    blind.blindPositionReasonDesc = RED._("blindcontroller.positionReason.06");
                                }
                            } else {
                                blind.blindPositionReasonCode = "04";
                                blind.blindPositionReasonDesc = RED._("blindcontroller.positionReason.04");
                            }
                            break;
                    }
                }
            } else {
                blind.blindPosition           = blind.nightposition;
                blind.blindPositionReasonCode = "02";
                blind.blindPositionReasonDesc = RED._("blindcontroller.positionReason.02");
                blind.sunInWindow             = false;
            }
            if (blind.blindPositionExpiry) {
                delete blind.blindPositionExpiry;
            }
        }
    }

    /*
     * Checks whether the current Blind Position has expired.
     */
    function hasBlindPositionExpired (expiryTimestampString) {
        var now      = new Date();
        if (expiryTimestampString) {
            var expiry   = new Date(expiryTimestampString);
            return (now > expiry)
        } else {
            return true;
        }
    }

    /*
     * For each blind, run the blind calculation process and if a different
     * position is determined send a message with the new position for the
     * channel.
     */
    function runCalc (node, msg, blinds, sunPosition, weather) {
        var i;
        for (i in blinds) {
            var previousBlindPosition = blinds[i].blindPosition;
            var previousSunInWindow   = blinds[i].sunInWindow;
            var previousBlindPositionReasonCode = blinds[i].blindPositionReasonCode;

            calcBlindPosition(blinds[i], sunPosition, weather);
            if ((blinds[i].blindPosition != previousBlindPosition) ||
                (blinds[i].sunInWindow != previousSunInWindow) ||
                (blinds[i].blindPositionReasonCode != previousBlindPositionReasonCode)) {
                msg.payload = blinds[i];
                msg.data = {
                    channel:       blinds[i].channel,
                    altitude:      sunPosition.altitude,
                    azimuth:       sunPosition.azimuth,
                    blindPosition: blinds[i].blindPosition
                };
                msg.topic = "blind";
                node.send(msg);
            }
        }
    }

    /*
     * When the blind position is manually specified, this function is used to
     * prepare the message and the expiry timestamp.
     */
    function setPosition (node, msg, blind) {
        blind.blindPosition           = msg.payload.blindPosition;
        blind.blindPositionExpiry     = calcBlindPositionExpiry (blind);
        blind.blindPositionReasonCode = "01";
        blind.blindPositionReasonDesc = RED._("blindcontroller.positionReason.01");
        msg.payload                   = blind;
        msg.topic                     = "blind";
        node.send(msg);
    }

    /*
     * Calculates the expiry timestamp
     */
    function calcBlindPositionExpiry (blind) {
        var expiryTimestamp      = new Date();
        expiryTimestamp.setHours(expiryTimestamp.getHours()+ blind.expiryperiod);
        return expiryTimestamp;
    }

    /*
     * Tests whether val has been set, and returns defaultVal if it hasn't
     */
    function defaultIfUndefined (val, defaultVal) {
        return (((typeof val == "undefined") || (val == "")) ? defaultVal : val);
    }

    /*
     * Function which is exported when the node-RED runtime loads the node on
     * start-up, and the basis of the Multi Blind Controller node.  The node
     * responds to four different input messages:
     * - blind: the input configuration parameters for a blind.  One message is
     *          expected to be received per blind on startup
     * - sun: the output of the Sun Position node containing the sun's current
     *        altitude and azimuth.  A message is expected to be received
     *        periodically, as this is the trigger to recalculate the blind
     *        position
     * - weather: the current weather conditions. A message is expected to be
     *            received periodically.
     * - blindPosition: message containing a specified blind position.
     *
     * The function maintains a state machine which allows the messages to be
     * received in any sequence.
     */
    function BlindControllerWithoutConfig(config) {
        RED.nodes.createNode(this, config);
        /*
         * Initialise node with value of configurable properties
         */
        this.name       = config.name;
        var node        = this;
        var blinds      = [];
        var weather     = {};
        var sunPosition = {};

        /*
         * Registers a listener on the input event to receive messages from the
         * up-stream nodes in a flow.  This function does not any values from
         * the input message.
         */
        this.on("input", function(msg) {
            var validMsg = validateMsg(node, msg);

            if (validMsg) {
                switch (msg.topic) {
                    case "sun":
                        sunPosition = msg.payload;
                        runCalc(node, msg, blinds, sunPosition, weather);
                        break;
                    case "blindPosition":
                        setPosition(node, msg, blinds[msg.payload.channel]);
                        break;
                    case "blind":
                        var channel = msg.payload.channel;
                        blinds[channel] = msg.payload;
                        /*
                         * Default settings if not specified in input msg
                         */
                        blinds[channel].mode          = defaultIfUndefined(msg.payload.mode,                 RED._("blindcontroller.placeholder.mode"));
                        blinds[channel].noffset       = defaultIfUndefined(msg.payload.noffset,       Number(RED._("blindcontroller.placeholder.noffset")));
                        blinds[channel].poffset       = defaultIfUndefined(msg.payload.poffset,       Number(RED._("blindcontroller.placeholder.poffset")));
                        blinds[channel].maxopen       = defaultIfUndefined(msg.payload.maxopen,       Number(RED._("blindcontroller.placeholder.maxopen")));
                        blinds[channel].maxclosed     = defaultIfUndefined(msg.payload.maxclosed,     Number(RED._("blindcontroller.placeholder.maxclosed")));
                        blinds[channel].nightposition = defaultIfUndefined(msg.payload.nightposition, Number(RED._("blindcontroller.placeholder.nightposition")));
                        blinds[channel].expiryperiod  = defaultIfUndefined(msg.payload.expiryperiod,  Number(RED._("blindcontroller.placeholder.expiryperiod")));
                        break;
                    case "weather":
                        weather = msg.payload;
                        runCalc(node, msg, blinds, sunPosition, weather);
                        break;
                    default:
                        break;
                }
            }
        });
    }

    /*
     * Function which is exported when the node-RED runtime loads the node on
     * start-up, and the basis of the Blind Controller node.  The node responds
     * to three different input messages:
     * - sun: the output of the Sun Position node containing the sun's current
     *        altitude and azimuth
     * - blindPosition: message containing a specified blind position
     * - weather: the current weather conditions
     */
    function BlindControllerWithConfig(config) {
        RED.nodes.createNode(this, config);
        /*
         * Initialise node with value of configurable properties
         */
        this.name     = config.name;
        var channel   = config.channel;
        var blinds      = [];
        blinds[channel] = {
            channel:              channel,
            mode:                 config.mode,
            orientation:          Number(config.orientation),
            noffset:              Number(defaultIfUndefined(config.noffset,       RED._("blindcontroller.placeholder.noffset"))),
            poffset:              Number(defaultIfUndefined(config.poffset,       RED._("blindcontroller.placeholder.poffset"))),
            top:                  Number(config.top),
            bottom:               Number(config.bottom),
            depth:                Number(config.depth),
            altitudethreshold:    Number(config.altitudethreshold),
            increment:            Number(config.increment),
            maxopen:              Number(defaultIfUndefined(config.maxopen,       RED._("blindcontroller.placeholder.maxopen"))),
            maxclosed:            Number(defaultIfUndefined(config.maxclosed,     RED._("blindcontroller.placeholder.maxclosed"))),
            temperaturethreshold: config.temperaturethreshold,
            cloudsthreshold:      config.cloudsthreshold,
            nightposition:        Number(defaultIfUndefined(config.nightposition, RED._("blindcontroller.placeholder.nightposition"))),
            expiryperiod:         Number(defaultIfUndefined(config.expiryperiod,  RED._("blindcontroller.placeholder.expiryperiod")))
        };
        this.blind      = blinds[channel];
        var node        = this;
        var sunPosition = {};
        var weather     = {};

        /*
         * Registers a listener on the input event to receive messages from the
         * up-stream nodes in a flow.  This function does not any values from
         * the input message.
         */
        var previousBlindPosition = -1;
        this.on("input", function(msg) {
            var validMsg = validateMsg(node, msg);

            if (validMsg) {
                switch (msg.topic) {
                    case "sun":
                        sunPosition = msg.payload;
                        runCalc(node, msg, blinds, sunPosition, weather);
                        break;
                    case "blindPosition":
                        setPosition(node, msg, blinds[msg.payload.channel]);
                        break;
                    case "weather":
                        weather = msg.payload;
                        runCalc(node, msg, blinds, sunPosition, weather);
                        break;
                    default:
                        break;
                }

                node.status({
                    fill:  (sunPosition.sunInSky) ? "yellow" : "blue",
                    shape: (blinds[channel].blindPosition == 100) ? "dot" : "ring",
                    text:  blinds[channel].blindPosition + "%"
                });
            }
        });
    }

    RED.nodes.registerType("multiblindcontroller", BlindControllerWithoutConfig);
    RED.nodes.registerType("blindcontroller", BlindControllerWithConfig);
};
