/**
 * Copyright 2015 Alisdair Smyth
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
     * Tests the validity of the input msg.payload before using this payload to run the calculation
     */
    function validateMsg(node, msg, callback) {
        var sunProperty = [
            "sunInSky",
            "azimuth",
            "altitude",
            "altitudeRadians"
        ];
        if (typeof msg.payload === "object") {
            var i;
            for (i in sunProperty) {
                if (!(sunProperty[i] in msg.payload)) {
                    node.error(RED._("blindcontroller.error.property-" + sunProperty[i] + "-missing"), msg);
                    return;
                }
            }
        } else {
            node.error(RED._("blindcontroller.error.invalid-payload"), msg);
            return;
        }
        if (typeof msg.payload.sunInSky != "boolean") {
            node.error(RED._("blindcontroller.error.invalid-sunInSky"), msg);
            return;
        }
        if (msg.payload.altitude > 90) {
            node.error(RED._("blindcontroller.error.invalid-altitude"), msg);
            return;
        }
        if ((msg.payload.azimuth < 0) || (msg.payload.azimuth > 360)) {
            node.error(RED._("blindcontroller.error.invalid-azimuth"), msg);
            return;
        }
        if ((msg.payload.increment <0) || (msg.payload.increment > 100)) {
            node.error(RED._("blindcontroller.error.invalid-increment"), msg);
            return;
        }
        callback();
    }

    /*
     * Function to determine whether the sun is considered to be in the window based on the orientation of the
     * window and the azimuth of the sun
     */
    function isSunInWindow(blind, azimuth) {
        var noffset = blind.noffset ? blind.noffset : 90;
        var poffset = blind.poffset ? blind.poffset : 90;

        var sunInWindow = false;

        /*
         * Checks the sun azimuth is between window orientation +/- offset.  Where the range includes ranges each
         * side of north, separate checks need to be performed either side of north
         */
        if (blind.orientation - noffset < 0) {
            if ((((360 - blind.orientation - noffset) <= azimuth) & (azimuth <= 360)) ||
                ((0 <= azimuth) && (azimuth <= blind.orientation + poffset))) {
                sunInWindow = true;
            }
        } else if (blind.orientation + poffset > 360) {
            if (((0 <= azimuth) & (azimuth <= (blind.orientation + poffset - 360))) ||
                (((blind.orientation - noffset) <= azimuth) && (azimuth <= 360))) {
                sunInWindow = true;
            }
        } else {
            if (((blind.orientation - noffset) <= azimuth) && (azimuth <= (blind.orientation + poffset))) {
                sunInWindow = true;
            }
        }
        return sunInWindow;
    }

    /*
     * Function to calculate the appropriate blind position based on the altitude of the sun, characteristics of
     * the window, with the target of restricting the extent to which direct sunlight enters the room
     */
    function calcBlindPosition (blind, sunPosition) {
        /*
         * For the given altitude of the sun, calculate the minimum height of an object that casts a shadow to the
         * specified depth. Convert this height into a blind position based on the dimensions of the window
         */
        var blindPosition = 0;
        if (sunPosition.altitude > blind.altitudethreshold) {
            var height = Math.tan(sunPosition.altitudeRadians) * blind.depth;
            if (height <= blind.bottom) {
                blindPosition = 100;
            } else if (height >= blind.top) {
                blindPosition = 0;
            } else {
                blindPosition = Math.ceil(100*(1 - (height - blind.bottom)/(blind.top - blind.bottom)));
                blindPosition = Math.ceil(blindPosition/blind.increment)*blind.increment;
            }
        }
        return blindPosition;
    }

    /*
     * Function which is exported when the node-RED runtime loads the node on start-up.
     */
    function setBlindPosition(config) {
        RED.nodes.createNode(this, config);
        /*
         * Initialise node with value of configurable properties
         */
        this.name     = config.name;

        var blind = {
            channel:     config.channel,
            orientation: Number(config.orientation),
            noffset:     Number(config.noffset),
            poffset:     Number(config.poffset),
            top:         Number(config.top),
            bottom:      Number(config.bottom),
            depth:       Number(config.depth),
            altitudethreshold: Number(config.altitudethreshold),
            increment:   Number(config.increment)
        };

        this.blind    = blind;
        var node      = this;

        /*
         * Registers a listener on the input event to receive messages from the up-stream nodes in a flow.  This
         * function does not any values from the input message.
         */
        var previousBlindPosition = -1;
        this.on("input", function(msg) {

            validateMsg(node, msg, function () {
                var blindPosition = -1;
                var statusFill;
                var sunInWindow = false;
                var sunPosition = msg.payload;
                if (sunPosition.sunInSky) {
                    sunInWindow = isSunInWindow(blind, sunPosition.azimuth);

                    if (sunInWindow) {
                        blindPosition = calcBlindPosition(blind, sunPosition);
                    } else {
                        blindPosition = 0;
                    }
                    statusFill = "yellow";
                } else {
                    blindPosition = 100;
                    statusFill = "blue";
                }

                if (blindPosition != previousBlindPosition) {
                    msg.payload = {
                        channel:       blind.channel,
                        blindPosition: blindPosition
                    };
                    msg.data = {
                        channel:       blind.channel,
                        altitude:      sunPosition.altitude,
                        azimuth:       sunPosition.azimuth,
                        sunInWindow:   sunInWindow,
                        blindPosition: blindPosition
                    };
                    msg.topic = "blind";
                    node.send(msg);

                    previousBlindPosition = blindPosition;
                }
                node.status({
                    fill:  statusFill,
                    shape: (blindPosition == 100) ? "dot" : "ring",
                    text:  blindPosition + "%"
                });
            });
        });
    }

    RED.nodes.registerType("blindcontroller", setBlindPosition);
};
