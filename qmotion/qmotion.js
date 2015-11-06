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

    function validateMsg(node, msg) {
        var validMsg = true;
        if (typeof msg.payload != "object") {
            node.error("qmotion.error.invalid-payload", msg);
            validMsg = false;
        }
        if ((validMsg) && ((msg.payload.blindPosition <0) || (msg.payload.blindPosition >100))) {
            node.error("qmotion.error.invalid-blindPosition: "+ msg.payload.blindPosition, msg);
            validMsg = false;
        }
        return validMsg;
    }

    function sendQmotionCommand (config) {
        RED.nodes.createNode(this, config);
        this.on("input", function(msg) {
            var node  = this;
            var validMsg = validateMsg(node, msg);
            if (validMsg) {
                var QmotionCommands = {
                    0:    1,
                    25:   4,
                    50:   8,
                    75:  12,
                    100:  2
                };
                var input         = msg.payload;

                var blindPosition = Math.ceil((input.blindPosition)/25)*25;
                var command = QmotionCommands[blindPosition];
                msg.data    = msg.payload;
                msg.payload = {
                    channel: input.channel,
                    command: command
                };
                msg.topic   = "blindCommand";
                node.send(msg);
            };
        });
    }
    RED.nodes.registerType("qmotion", sendQmotionCommand);
};