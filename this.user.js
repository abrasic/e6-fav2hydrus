// ==UserScript==
// @name         e621 fav2hydrus
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http*://e621.net/*
// @grant        GM_xmlhttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==
var apiReady = false
async function init(){

    var hideFavBtnOnFail = await GM.getValue("hideFavBtnOnFail", true);
    var address = await GM.getValue("address","http://127.0.0.1:45869");
    var accessKey = await GM.getValue("accessKey", "1eae48f6d826762be9fea491be919ccdb948ba45650f2da46b26b320faa94141");
    var assetImported = false;
    var errorText = "";

    $("body").append('<div id="f2h-settings" style="display:none; position:absolute;right:0;top: 0;background: rgba(0,0,0,0.9);padding: 2px;width: 200px;padding: 10px;height: 200px;"><h1>f2h</h1> <p>v1</p><div title="If the Hydrus Client API doesn\'t connect, the favorite button will be hidden. This acts as an option to discourage you from favoriting posts you like without saving them locally."><p><input id="f2h-hideFavBtn" type="checkbox"> Hide Fav Button Fail</p></div><div title="Your Hydrus Client API address">API Address<input id="f2h-address" type="text" value=""></div><div title="Your Hydrus Client API access key">Access Key<input id="f2h-accessKey" type="text"><p></p></div><button id="f2h_save">Save and close</button></div>');
    $("#nav-more").after('<li id="nav-f2h"><a href="#" id="nav-f2h">f2h Settings</a></li>');

    if (hideFavBtnOnFail === true){
        if ($("button#remove-fav-button").css("display") === "none") {
            $("button#add-fav-button").css("display", "none");
            $("button#add-to-favorites").css("display", "none");
        }
    }

    var hideFavCheck = document.getElementById("f2h-hideFavBtn");
    hideFavCheck.checked = await GM.getValue("hideFavBtnOnFail");

    var inputAddress = document.getElementById("f2h-address");
    inputAddress.value = await GM.getValue("address");

    var inputAccessKey = document.getElementById("f2h-accessKey");
    inputAccessKey.value = await GM.getValue("accessKey");

    async function showError(){
        if (await GM.getValue("hideFavBtnOnFail",true)) {
            $("#add-fav-button").remove();
            $("#add-to-favorites").remove();
        }

        $("#image-extra-controls").after("<div class='notice notice-deleted'>&#128305; ERROR: "+ errorText +"</div>");
        apiReady = false;

    }

    GM_xmlhttpRequest ( {
        method:     "GET",
        url:        address + "/api_version",
        onload: function (response) {
            console.log(response.responseText)
            var json = JSON.parse(response.responseText);
            if (json["version"]) {
                if (hideFavBtnOnFail === true){
                    if ($("button#remove-fav-button").css("display") === "none") {
                        $("button#add-fav-button").css("display", "inline-block");
                        $("button#add-to-favorites").css("display", "inline-block");
                    }
                }
                $("button#add-fav-button").append(" &#128305;");
                apiReady = true;
            } else {
                errorText = 'Address "' +address+ '" is not a Hydrus Client API.'
                showError();
            }
        },
        onerror: function (response) {
            errorText = 'Address "' +address+ '" is not responding.'
            showError();
            apiReady = false;
        },
    });

    $("button#add-fav-button").click(function() {
        if ($("button#add-fav-button").attr("class") == "button btn-success") {
            if (apiReady && assetImported === false){
                var assetUrl = $("#image-container").attr("data-file-url");
                var pathJson = '{"url": "'+assetUrl+'"}';

                GM_xmlhttpRequest ( {
                    method: "POST",
                    url: address + "/add_urls/add_url",
                    data: pathJson,
                    headers: {
                        "Hydrus-Client-API-Access-Key": accessKey,
                        "Content-Type": "application/json"
                    },
                    onload: function (response) {
                        function isJson(str) {
                            try {
                                JSON.parse(str);
                            } catch (err) {
                                return false;
                            }
                            return true;
                        }
                        if (isJson(response.responseText)){
                            var json = JSON.parse(response.responseText);
                            if (json["human_result_text"]){
                                assetImported = true;
                                $('#image-extra-controls').after('<div class="notice notice-parent" id="pending-approval-notice">&#128305; Asset imported to Hydrus.</div>');
                            } else {
                                errorText = "Hydrus API returned an error: " + response.responseText;
                                showError();
                            }
                        } else {
                            errorText = "Hydrus API returned an error: " + response.responseText;
                            showError();
                        }

                    },
                    onerror: function (response) {
                        showError("test");
                    },
                });
            }
        }
    });

    $("#nav-f2h").click(function() {
        if ($("#f2h-settings").css("display") == "none") {
            $("#f2h-settings").css("display", "block");
        } else {
            $("#f2h-settings").css("display", "none");
        }
    });
}

window.onload = init()

document.addEventListener("click", async function(event){
    // console.log(event.target.id);
    if (event.target.id == "f2h_save"){
        $("#f2h-settings").css("display","none");
        var hideFavCheck = document.getElementById('f2h-hideFavBtn');
        await GM.setValue("hideFavBtnOnFail", hideFavCheck.checked);

        var address = document.getElementById('f2h-address');
        await GM.setValue("address", address.value);

        var accessKey = document.getElementById('f2h-accessKey');
        await GM.setValue("accessKey", accessKey.value);
        $("#nav-f2h").html("(refresh to apply changes)");
    }
    if (event.target.id == "remove-fav-button"){
        if (await GM.getValue("hideFavBtnOnFail", true) && apiReady === false) {
            $("#add-fav-button").remove();
            $("#add-to-favorites").remove();
        }
    }
});
