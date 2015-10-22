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
    var SunCalc = require('suncalc');

    function CalculateMillis(t) {
        return Date.UTC(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate(),t.getUTCHours(),t.getUTCMinutes());
    }

    /*
     * Function to calculate the current position of the sun based on a specified location
     */
    function getSunPosition(location, stConfig) {
        var now             = new Date();
        var sunPosition     = SunCalc.getPosition(now, location.lat, location.lon);
        var sunTimes        = SunCalc.getTimes(now, location.lat, location.lon);
        var altitudeDegrees = 180/Math.PI*sunPosition.altitude;
        var azimuthDegrees  = 180 + 180/Math.PI*sunPosition.azimuth;
        var sunInSky;

        var nowMillis   = CalculateMillis(now);
        var startMillis = CalculateMillis(sunTimes[stConfig.start]);
        var endMillis   = CalculateMillis(sunTimes[stConfig.end]);
        if ((nowMillis > startMillis) & (nowMillis < endMillis)) {
            sunInSky = true;
        } else {
            sunInSky = false;
        }

        return {sunInSky: sunInSky, altitude: altitudeDegrees, azimuth: azimuthDegrees}
    }

    /*
     * Function to determine whether the sun is considered to be in the window based on the orientation of the
     * window and the azimuth of the sun
     */
    function isSunInWindow(blind, azimuth) {
        var offset = 90;
        var sunInWindow = false;

        /*
         * Checks the sun azimuth is between window orientation +/- offset.  Where the range includes ranges each
         * side of north, separate checks need to be performed either side of north
         */
        if (blind.orientation - offset < 0) {
            if ((((360 - blind.orientation - offset) <= azimuth) & (azimuth <= 360)) |
                ((0 <= azimuth) & (azimuth <= blind.orientation + offset))) {
                sunInWindow = true;
            }
        } else if (blind.orientation + offset > 360) {
            if (((0 <= azimuth) & (azimuth <= (blind.orientation + offset - 360))) |
                (((blind.orientation - offset) <= azimuth) & (azimuth <= 360))) {
                sunInWindow = true;
            }
        } else {
            if (((blind.orientation - offset) <= azimuth) & (azimuth <= (blind.orientation + offset))) {
                sunInWindow = true;
            }
        }
        return sunInWindow;
    }

    /*
     * Function to calculate the appropriate blind position based on the altitude of the sun, characteristics of
     * the window, with the target of restricting the extent to which direct sunlight enters the room
     */
    function calcBlindPosition (blind, altitude) {
        /*
         * For the given altitude of the sun, calculate the maximum height of an object that casts a shadow to the
         * specified depth
         */
        var blindPosition = 0;
        var height = Math.tan(altitude) * blind.depth;
        if (height <= blind.bottom) {
            blindPosition = 100;
        } else {
            blindPosition = ((100*(1-(height - blind.bottom)/(blind.top - blind.bottom)))%25)*25;
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
        this.lat      = config.lat;
        this.lon      = config.lon;
        this.channel  = config.channel;
        this.orientation = config.orientation;
        this.top      = config.top;
        this.bottom   = config.bottom;
        this.depth    = config.depth;
        this.start    = config.start;
        this.end      = config.end;
        var node      = this;

        var location = {
            lat: config.lat,
            lon: config.lon
        }

        var blind = {
            channel:     config.channel,
            orientation: config.orientation,
            top:         config.top,
            bottom:      config.bottom,
            depth:       config.depth
        };
        var sunTimeConfig = {
            start: config.start,
            end:   config.end
        }

        /*
         * Registers a listener on the input event to receive messages from the up-stream nodes in a flow.  This
         * function does not any values from the input message.
         */
        this.on("input", function(msg) {
            var blindPosition         = 0;
            var previousBlindPosition = 0;
            var sunPosition = getSunPosition(location, sunTimeConfig);

            if (sunPosition.sunInSky) {
                if (isSunInWindow(blind, sunPosition.azimuth)) {
                    blindPosition = calcBlindPosition(blind, sunPosition.altitude);
                }
            } else {
                blindPosition = 100;
            }

            if (blindPosition != previousBlindPosition) {
                msg.payload = { channel : blind.channel, blindPosition : blindPosition};
                previousBlindPosition = blindPosition;
            } else {
                msg.payload = {};
            }
            msg.topic = "blind";
            node.send(msg);
        });
    }

    RED.nodes.registerType("blind", setBlindPosition);
}
