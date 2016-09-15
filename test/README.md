# Test Flow
This directory contains a Node-RED flow which is designed to test the functionality of **node-red-contrib-blindcontroller**.  The tests are manually invoked using the standard inject node, which in turn inject messages into the nodes of this project.  The behaviour of the nodes is observable in the Debug tab within the Node-RED UI.

##Negative Test Cases
Series of negative tests that are expected to result in **node-red-contrib-blindcontroller** throwing errors.  Separate tests are included for each message type (designated by topic) that can be processed by the nodes:
* Invalid Topic i.e. unknown message types
* Invalid Blind message
* Invalid Sun message
* Invalid Weather message
* Invalid Blind Position message

The tests include:
* Invalid data types at the property level e.g. String where Number is expected
* Boundary tests at the property level e.g. Latitude greater than 90
