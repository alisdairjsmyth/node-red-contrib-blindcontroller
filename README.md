# node-red-contrib-blindcontroller
<a href="http://nodered.org" target="_new">Node-RED</a> node that determines blind position based on the position of the sun.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-contrib-blindcontroller

Usage
-----

This node emits a <b>msg.payload</b> with the following properties:
* <b>channel</b>: identifier of the blind.  A typical flow is likely to include multiple instances of this node, and this is the mechanism to distinguish blind in subsequent processing.
* <b>blindPosition</b>: calculated position of the blind where 0 is fully open and 100 is fully closed
This fragment of the msg is intended to be used to control the blind hardware.

<b>msg.data</b> is set with values to debug and/or monitor the process.  In addition the values included in the payload, it also includes:
* <b>altitude</b>: altitude of the sun
* <b>azimuth</b>: azimuth of the sun
* <b>sunInWindow</b>: is the sun in the window

It also sets the <b>msg.topic</b> to "blind".

Properties
----------

This node is configured with a number of properties, that define the location, details of the blind, and the bounds of daylight hours.

The location is identified with geospatial coordinates:
* <b>lat</b>: latitude of the location
* <b>lon</b>: longitude of the location

The following details about the blind are used to identify and then determine the appropriate position of the blind:
* <b>channel</b>: identifier of the blind - which is used in the emitted <b>msg.payload</b>
* <b>orientation</b>: the bearing representing the perpendicular to the of the window
* <b>negative offset</b>: (optional) anti-clockwise offset from orientation for determination of whether the sun is coming through window
* <b>positive offset</b>: (optional) clockwise offset from orientation for determination of whether the sun is coming through window
* <b>top</b>: measurement from the floor to top of the window covered by the blind
* <b>bottom</b>: measurement from the floor to bottom of the window covered by the blind
* <b>depth</b>: the extent to which direct sunlight is to be allowed into the room through the window, defined as a length on the floor
* <b>altitude threshold</b>: (optional) minimum altitude of the sun for determination of blind position

The properties define the bounds of daylight hours using the times of day values of the suncalc module.
* <b>start</b>: time of day that constitutes the start of daylight hours
* <b>end</b>: time of day that constitutes the end of daylight hours

Behaviour
---------

The blindPosition in the <b>msg.payload</b> is set as follows:
* Outside the bounds of the daylight hours the blindPosition is set to 100 i.e. fully closed
* During daylight hours, the blindPosition is set to 0 i.e. fully open, if the sun's azimuth means direct sunlight is not passing through the window
* Otherwise the blindPosition is set restrict direct sunlight into the room based on the depth property.

The author has implemented this node to automate QMotion motorised blinds.