// ==UserScript==
// @name         e621 fav2hydrus
// @namespace    https://abrasic.com
// @version      1.2.1
// @description  Favoriting e621 posts imports it to Hydrus
// @author       Abrasic
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
    var importTags = await GM.getValue("importTags", true);
    var importGeneral = await GM.getValue("importGeneral", true);
    var assetImported = false;
    var tags = [];
    var pageUrl = location.protocol + '//' + location.host + location.pathname;
    var assetId = window.location.pathname.substring(window.location.pathname.lastIndexOf('/')+1);
    var fileHash = undefined;

    $("body").append('<div id="f2h-settings" style="display:none; position:absolute;right:0;top: 0;background: rgba(0,0,0,0.9);padding: 2px;width: 200px;padding: 10px;height: 500px;"><h1>f2h</h1> <p>v1.2</p> <div>API Address<input id="f2h-address" type="text" value=""></div> <div><p>Access Key<input id="f2h-accessKey" type="text"></p></div> <div><p><input id="f2h-hideFavBtn" type="checkbox"> Hide Fav Button on Fail</p></div> <div><p><input id="f2h-importTags" type="checkbox"> Import Tags</p></div><div style="margin-left:10px"><p><input id="f2h-importGeneral" type="checkbox"> Include General Tags</p></div><button id="f2h_save">Save and close</button></div></div>');
    $("#nav-more").after('<li id="nav-f2h"><a href="#" id="nav-f2h">f2h Settings</a></li>');

    if (hideFavBtnOnFail === true){
        if ($("button#remove-fav-button").css("display") === "none") {
            $("button#add-fav-button").css("display", "none");
            $("button#add-to-favorites").css("display", "none");
        }
    }
    if (await GM.getValue("importTags") === false ){
        document.getElementById('f2h-importGeneral').disabled = true
    } else {
        document.getElementById('f2h-importGeneral').disabled = false
    }

    document.getElementById("f2h-address").value = await GM.getValue("address");
    document.getElementById("f2h-accessKey").value = await GM.getValue("accessKey");
    document.getElementById("f2h-hideFavBtn").checked = await GM.getValue("hideFavBtnOnFail");
    document.getElementById("f2h-importTags").checked = await GM.getValue("importTags");
    document.getElementById("f2h-importGeneral").checked = await GM.getValue("importGeneral");

    async function showError(str){
        if (await GM.getValue("hideFavBtnOnFail",true)) {
            $("#add-fav-button").remove();
            $("#add-to-favorites").remove();
        }

        $("#image-extra-controls").after("<div class='notice notice-deleted'>&#128305; ERROR: "+ str +"</div>");
        apiReady = false;

    }

    if (await GM.getValue("importTags") === true){
        GM_xmlhttpRequest ( {
            method: "GET",
            url: "https://e621.net/posts.json?tags=id:" + assetId,
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
                    $('#f2h-status').html('&#128305; Applying tags...');
                    var i;
                    var json = JSON.parse(response.responseText);
                    if (json.posts[0]){
                        var tagList = json.posts[0].tags
                        var getHash = json.posts[0].file.md5
                        for (i = 0; i < tagList.species.length; i++) {
                            tags.push('species:' + tagList.species[i]);
                        }
                        for (i = 0; i < tagList.character.length; i++) {
                            tags.push('character:' + tagList.character[i]);
                        }
                        for (i = 0; i < tagList.artist.length; i++) {
                            tags.push('creator:' + tagList.artist[i]);
                        }
                        if (importGeneral === true){
                            for (i = 0; i < tagList.general.length; i++) {
                                tags.push(tagList.general[i]);
                            }
                        }
                        fileHash = getHash
                        console.log(tags);
                        console.log(fileHash);
                    } else {
                        // do nothing. it's' deleted.
                    }
                } else {
                    showError("e621 API returned an error: " + response.responseText);
                }
            },
            onerror: function (response) {
                showError("e621 API returned an error: " + response.responseText);
            },
        });
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
                showError('Address "' +address+ '" is not a Hydrus Client API.');
            }
        },
        onerror: function (response) {
            showError('Address "' +address+ '" is not responding.');
            apiReady = false;
        },
    });

    $("button#add-fav-button").click(async function() {
        if ($("button#add-fav-button").attr("class") == "button btn-success") {
            if (apiReady && assetImported === false){
                $('#image-extra-controls').after('<div id="f2h-status" class="notice notice-parent" id="pending-approval-notice">&#128305; Importing asset...</div>');
                var assetUrl = $("#image-container").attr("data-file-url");
                var pathJson = JSON.stringify({"url" : assetUrl, "service_names_to_tags" : { "my tags" : tags }});
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
                                console.log(pageUrl);
                                var urlJson = JSON.stringify({"url_to_add" : pageUrl, "hash" : fileHash });
                                GM_xmlhttpRequest ( {
                                    method: "POST",
                                    url: address + "/add_urls/associate_url",
                                    data: urlJson,
                                    headers: {
                                        "Hydrus-Client-API-Access-Key": accessKey,
                                        "Content-Type": "application/json"
                                    },
                                    onload: function (response) {
                                        if (response.status == 200){
                                            assetImported = true;
                                            $('#f2h-status').html('&#128305; Asset imported to Hydrus');
                                        } else {
                                            showError("Hydrus API returned an error code " + response.status);
                                        }

                                    },
                                    onerror: function (response) {
                                        showError("Hydrus API returned an error: " + response.responseText);
                                    },
                                });
                            } else {
                                showError("Hydrus API returned an error: " + response.responseText);
                            }
                        } else {
                            showError("Hydrus API returned an error: " + response.responseText);
                        }

                    },
                    onerror: function (response) {
                        showError("Hydrus API returned an error: " + response.responseText);
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
    var hideFavBtnOnFail = document.getElementById('f2h-hideFavBtn');
    var address = document.getElementById('f2h-address');
    var accessKey = document.getElementById('f2h-accessKey');
    var importTags = document.getElementById('f2h-importTags');
    var importGeneral = document.getElementById('f2h-importGeneral');

    // console.log(event.target.id);
    if (event.target.id == "f2h_save"){
        $("#f2h-settings").css("display","none");
        await GM.setValue("hideFavBtnOnFail", hideFavBtnOnFail.checked);
        await GM.setValue("address", address.value);
        await GM.setValue("accessKey", accessKey.value);
        await GM.setValue("importTags", importTags.checked);
        await GM.setValue("importGeneral", importGeneral.checked);
        $("#nav-f2h").html("(refresh to apply changes)");
    }
    if (event.target.id == "remove-fav-button"){
        if (await GM.getValue("hideFavBtnOnFail", true) && apiReady === false) {
            $("#add-fav-button").remove();
            $("#add-to-favorites").remove();
        }
    }
    if (event.target.id == "f2h-importTags"){
        if (importTags.checked === false) {
            importGeneral.checked = false
            importGeneral.disabled = true
        } else {
            importGeneral.disabled = false
        }
    }
});
