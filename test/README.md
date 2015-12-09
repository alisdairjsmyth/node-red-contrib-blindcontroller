# Test flow for node-red-contrib-blindcontroller
At this stage, testing of node-red-contrib-blindcontroller has not been
automated.  Rather the flow within this directory has been used to manually
test the blindcontroller node(s).

The file contains 4 tabs:
* **Negative Test Cases**: a series of tests to validate the checks performed
by the node when processing received messages.  In each case a **node.error**
should be thrown, which should be visible in both the **debug** tab and the console.
* **Orientation**: tests to validate the calculations that determine whether
the sun is in the window.
* **Increments**: tests to validate the calculation of blind position based on
different **increment** settings.
* **Home**: tests to validate the calculations using the author's home
configuration.  The tests can be run with differing climatic conditions:
    * Normal weather conditions i.e. neither overcast or extreme heat
    * Overcast
    * Extreme heat
    * Overcast and extreme heat

The tests are manually invoked, and the results manually checked using the
output in the **debug** tab.
