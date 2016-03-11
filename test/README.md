# Test Flow
This directory contains a Node-RED flow which is designed to test the functionality of **node-red-contrib-blindcontroller**.  The tests are manually invoked using the standard inject node, which in turn inject messages into the nodes of this project.  The behaviour of the nodes is observable in the Debug tab within the Node-RED UI.

Negative Test Cases
-------------------
Series of negative tests that are expected to result in **node-red-contrib-blindcontroller** throwing errors.  Separate tests are included for each message type (designated by topic) that can be processed by the nodes:
* Invalid Topic i.e. unknown message types
* Invalid Blind message
* Invalid Sun message
* Invalid Weather message
* Invalid Blind Position message

The tests include:
* Invalid data types at the property level e.g. String where Number is expected
* Boundary tests at the property level e.g. Latitude greater than 90

Orientation (Default)
---------------------
This test is to validate the "sun in window" aspect of the controller based on default values of **mode**, **maxopen**, **maxclosed**, **nightposition**, which is based on the azimuth of the sun and the orientation of the window.

Simulates the movement of the sun in Melbourne on 8 December 2015.  The test includes 4 identical blinds at different orientations, 45, 135, 225, and 315.
The blinds have the following properties:
* Top: 2 metres
* Bottom: 1 metre
* Negative Offset: 90 degrees
* Positive Offset: 90 degrees
* Depth: 1 metre

On 8 December 2015:
* Sunrise was at 05:52 at a azimuth of 119.52
* Sun peak level was at 13:12 at a azimuth of virtually north
* Sunset was at 20:33 at a azimuth of 240.47

In the morning, the control is of the blinds at the orientation of 45 and 135, with the blinds rising as the sun progressively gets higher in the sky.

In the evening, the control is of the blinds at the orientation of 225 and 315, with the blinds being progressively close as the sun gets lower in the sky.

Orientation
-----------
As per **Orientation (Default)** except the blinds have the following properties:
* Mode: Summer
* Max Open Position: 25
* Max Closed Position: 75
* Night Position: 0

Orientation (Winter)
--------------------
As per **Orientation** except the blinds configured to operate under the **Winter** mode.

Increments
----------
This test is to validate the "increment" logic of the controller.  A feature intended to support blinds with different degrees of control fidelity.

Simulates the movement of the sun in Melbourne on 8 December 2015.  The test includes 6 identical blinds that can be controlled at different increments (1,5,20,25,50,100).
The blinds have the following properties:
* Orientation: 45 degrees
* Top: 2 metres
* Bottom: 1 metre
* Negative Offset: 90 degrees
* Positive Offset: 90 degrees
* Depth: 1 metre

Manual
------
This test is to validate the processing of **Blind Position** messages.  This is a feature which allows the blind position to be externally set, which is typically invoked manually.

Such blind positions have an associated expiry.
