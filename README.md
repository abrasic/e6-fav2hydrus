# Fav2Hydrus for e621
A Tampermonkey script that auto-imports posts to Hydrus that you favorite on e621.
This is mostly is a practice script to see how capable I am with making stuff in Tampermonkey. It may or may not be useful to you at all.

# Install
0) Download [Hydrus Network](https://hydrusnetwork.github.io/hydrus/) if you don't have it yet.
1) Download [Tampermonkey](https://www.tampermonkey.net/) for your browser
2) Locate the "this.user.js" file in this repo and click "Raw".
3) Click "Install" when Tampermonkey tab shows up.

**Upon using the script for the first time you will encounter popups from Tampermonkey asking you to accept outside requests. Click "always allow" when any of them pop up.**

# Preperation (Hydrus)
This script requires Hydrus' Client API to run.

1) In Hydrus go to **services > manage services** and double-click *client api* in the list.
2) Make sure "do not run client api service" is **unchecked** and click *apply*.
3) Then go to **services > review services**, click the *client api* tab and click **add > manually**.
4) In the new window, copy the access key into a notepad or something. You will need it for later.
5) Give this api service the **add urls for processing** and **add tags to files** permissions. Click *apply*.
6) In the *review services* window, click **open client api base url** and copy the IP address it took you to. You will also need that for later.
7) Right-click on the page tabs, then click **new page > download > url**
8) Click on **tag import options** and untick the box in the **default options** category and tick the **get tags** box at the bottom of the window. Click **apply**.

# Preperation (Userscript)
When you visit the e621 posts page, you should see a "f2h Settings" button in the top nav bar. Click the button to toggle the settings window at any time.

**API Address** > The IP address that the API runs on that you copied from step 6 above. By default it is `http://127.0.0.1:45869/`

**Access key** > The access key you copied from step 4 above.

**Hide Fav Button on Fail** > If the Hydrus API does not respond, the favorite buttons will be hidden. This option acts as a discourager in order to save all posts that you like locally, so if they are deleted off the internet somehow, you have a backup. Lucky you!

**Import Tags** > Enabled by default. Posts that are imported will be applied their **artist**, **species** and **character** tags into Hydrus.

**Include General Tags** > Disabled by default. When enabled, all general tags will be applied to the imported post.

Once all settings are how you need them, click "Save and close" and refresh. The script should *finally* start working.
