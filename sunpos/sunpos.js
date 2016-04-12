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

    function getSunPosition(config) {
        RED.nodes.createNode(this, config);

        var stConfig = {
            start: config.start,
            end:   config.end
        };

        var location = {
            lat:   config.lat,
            lon:   config.lon
        };
        var node     = this;

        this.on("input", function(msg) {
            var now = (typeof msg.time != "undefined") ? new Date(msg.time) : new Date();

            var sunPosition     = SunCalc.getPosition(now, location.lat, location.lon);
            var sunTimes        = SunCalc.getTimes   (now, location.lat, location.lon);
            var altitudeDegrees = 180 / Math.PI       * sunPosition.altitude;
            var azimuthDegrees  = 180 + 180 / Math.PI * sunPosition.azimuth;

            var nowMillis   = now.getTime();
            var startMillis = sunTimes[stConfig.start].getTime();
            var endMillis   = sunTimes[stConfig.end].getTime();

            var sunInSky = (((nowMillis > startMillis) && (nowMillis < endMillis)));
            if (sunInSky) {
                node.status({fill:"yellow", shape: "dot", text: "day"});
            } else {
                node.status({fill:"blue", shape: "dot", text: "night"});

            }

            msg.payload = {
                sunInSky:        sunInSky,
                altitude:        altitudeDegrees,
                azimuth:         azimuthDegrees,
                altitudeRadians: sunPosition.altitude,
                azimuthRadians:  sunPosition.azimuth
            };
            msg.location = location;
            msg.topic    = "sun";
            msg.time     = now;
            node.send(msg);
        });
    }
    RED.nodes.registerType("sunpos", getSunPosition);
};
