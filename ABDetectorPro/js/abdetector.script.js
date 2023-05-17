/*
================================================================
 * Copyright (c) 2023 Flerosoft (https://flerosoft.com)
 * Software Name: Ad Block Detector Pro | Light-weight Pure JavaScript Plugin
 * Version: 1.0.0
 * Product Page : https://adblockdetectorpro.flerosoft.com
 * Documentation: https://adblockdetectorpro.flerosoft.com/docs
 * Changelog: https://adblockdetectorpro.flerosoft.com/docs
 * Description: AdBlock Detector Pro is a pure JavaScript plugin that helps you identify whether an ad-blocker is being used on a user's browser. If an ad blocker is detected, it shows a popup message to users, asking them to disable their ad blockers.
================================================================
*/

(function (root, factory) {
  const pluginName = "ABDetector";
  if (typeof define === "function" && define.amd) {
    define([], factory(pluginName));
  } else if (typeof exports === "object") {
    module.exports = factory(pluginName);
  } else {
    root[pluginName] = factory(pluginName);
  }
})(this, function () {
  "use strict";

  /**
   * Merge config with user options
   * @param {Object} config Default settings
   * @param {Object} options User options
   */
  const extend = (config, options) => {
    let prop, extended = {};
    for (prop in config) {
      if (Object.prototype.hasOwnProperty.call(config, prop)) {
        extended[prop] = config[prop];
      }
    }
    for (prop in options) {
      if (Object.prototype.hasOwnProperty.call(options, prop)) {
        extended[prop] = options[prop];
      }
    }
    return extended;
  };


  /**
   * Disable right click or devtools
   */
  const allowDevToolsAccess = (enable) => {
    
    const body = document.body;
    body.setAttribute('oncontextmenu', enable ? null : 'return false;');

    const ctrlShiftKey = (e, keyCode) => e.ctrlKey && e.shiftKey && e.keyCode === keyCode.charCodeAt(0);

    document.onkeydown = (e) => {
      // Disable F12, Ctrl + Shift + I, Ctrl + Shift + J, Ctrl + U
      if (
        e.key === 123 ||
        ctrlShiftKey(e, "I") ||
        ctrlShiftKey(e, "J") ||
        ctrlShiftKey(e, "C") ||
        (e.ctrlKey && e.key === "U".charCodeAt(0))
      )
        return enable;
    };
  };

  /**
   * Generate modal UI with user config settings
   * @param {Object} config 
   */
  const constructModal = (config) => {
    const stepsStr = config.screenTwoSteps.reduce((acc, curr)=> acc.concat(`<li>${curr}</li>`),"")

    var alertModal = `<div class="abdmodal"> <div class="abdmodal-wrapper"><div class="abdmodal-content" ><div class="close-icon" id="closeIcon">${config.showCloseIcon ? closeIcon : ""}</div><div class="screen-one" id="screenOne"><div class="abdmodal-head"><div class="icon">${handIcon}</div> <div class="heading">${config.titleText}</div> </div><div class="abdmodal-body"> <p>${config.descText}</p></div><div class="abdmodal-footer"><button type="button" class="btn">${config.btnText}</button><div class="help-text">${config.screenOneHelpText}</div></div></div><!--abdmodal-content 1 end--><div class="screen-two" id="screenTwo"> <div class="abdmodal-head"><div class="heading">${config.screenTwoTitle}<div class="extension-icon"></div></div> </div><div class="abdmodal-body"><ul>${stepsStr}</ul></div><div class="abdmodal-footer"><div class="help-text">${config.screenTwoHelpText}</div></div></div><!--abdmodal-content 2 end--></div></div></div>`;

    const modalWrap = document.createElement("div");
    modalWrap.setAttribute("id", "abDetectorModal");
    modalWrap.classList.add(`ab-detector-wrap`);
    modalWrap.innerHTML = alertModal;

    const root = modalWrap;
    root.style.setProperty("--popup-background", config.popupBackgroundColor);
    root.style.setProperty("--popup-backdrop-color", config.popupBackdropColor);
    root.style.setProperty("--icon-color", config.iconColor);
    root.style.setProperty("--btn-color", config.btnColor);
    root.style.setProperty("--btn-background-color", config.btnBackgroundColor);
    root.style.setProperty("--title-color", config.titleColor);
    root.style.setProperty("--desc-color", config.descColor);
    root.style.setProperty("--help-text-color", config.helpTextColor);
    root.style.setProperty("--steps-color", config.screenTwoStepsColor);

    const modal = modalWrap.querySelector(".abdmodal");
    const modalContent = modalWrap.querySelector(".abdmodal .abdmodal-content");
    document.body.appendChild(modalWrap);
    if (config.secureMode) { allowDevToolsAccess(false);}

    setTimeout(() => {
      modal.style.cssText = `z-index: ${config.zIndex};opacity: 1;visibility: visible;`;
      modalContent.style.cssText = `transform: scale(1);max-width:${config.popupMaxWidth}px`;
      document.body.style.overflowY = "hidden";
      config.onDetected();
    }, 500);

    modalWrap.addEventListener("click", function (e) {
      if (e.target.classList.contains("help-text")) {
        modalWrap.classList.toggle("screen-two-active");
      }
      if (e.target.classList.contains("btn")) {
        config.onDisabledAdblockBtnClick();
        location.reload();
      }
      if(e.target.classList.contains("close-icon") || e.target.closest("div").classList.contains("close-icon")){
        modal.style.cssText = `opacity: 0;visibility: hidden;`;
        modalContent.style.cssText = `transform: scale(0);max-width:${config.popupMaxWidth}px`;
        document.body.style.overflowY = "initial";
        allowDevToolsAccess(true);
        config.onCloseIconClick();
      }
    });
  };

  /**
   * Test 1 - Element Injection : To display or not ad blocker popup
   * @returns true|false
   */
  const performDivTest = () => {
    const adClasses = ["ad", "ads", "adsbox", "doubleclick", "ad-placement", "ad-placeholder", "adbadge", "BannerAd"];
    const adDetectorElm = document.createElement("div");
    adDetectorElm.setAttribute("id", "adDetectorElm")
    for (let item of adClasses) {
      adDetectorElm.classList.add(item);
    }
    document.body.appendChild(adDetectorElm);
    const getProperty = window.getComputedStyle(adDetectorElm).getPropertyValue("display");
    return getProperty === 'none'
  };

  /**
   * Test 2 - Fake Script Call : To display or not ad blocker popup
   * @returns true|false
  */
  const performBasicScriptTest = () => {
    const testUrl = "/adex.js";
    return new Promise((resolve) => {
      var xhr = new XMLHttpRequest();
      xhr.open("HEAD", testUrl, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      xhr.send();
    });
  };

  /**
   * Test 3 - Real Script Call :  To display or not ad blocker popup
   * @returns true|false
  */
  const performAdvScriptTest = () => {
    const testUrl = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
    return new Promise((resolve) => {
      var xhr = new XMLHttpRequest();
      xhr.open("HEAD", testUrl, true);
      xhr.onreadystatechange = function () {
        if(xhr.responseURL !== testUrl) {
          resolve(true);
        }
        else if (xhr.readyState === 4 && xhr.status === 0) {
          resolve(true);
        } else if (xhr.readyState === 4 && xhr.status === 404) {
          resolve(false);
        }
      };
      xhr.send();
    });
  };

  /**
   * Removes injected HTML
   */
  const cleanDocument = () => {
     const adDetectorElm = document.querySelector("#adDetectorElm")
     adDetectorElm.remove();
  }

  /**
   * Plugin Object
   * @param {Object} options User options
   * @constructor
   */
  class Plugin {
    constructor(options) {
      /*
*--------------------------------------------------------------------------
* CONFIG OR SETTINGS - Customize the adblock popup
*--------------------------------------------------------------------------
*/
  const config = {
    zIndex: 99999, // z-index css property of popup, increase if popup hides behind other elements
    popupBorderRadius: 24, // border-radius of the popup(rounded corners)
    popupMaxWidth: 500, // Max width of the popup
    secureMode:true, // true|false - If true, right-click and element inspection will be disabled  
    showCloseIcon: true, // Show close icon to hide popup
    popupBackgroundColor:"#ffffff", // The background color of popup
    popupBackdropColor: "rgba(0, 0, 0, 0.6)", // Backdrop or overlay color behind popup
    iconColor: "#E2535C", // Icon color of popup (Please note there are 3 icons already present in the file (handIcon, adIcon, faceIcon) you can use any of the icons, just change icon name in constructModal function)
    btnBackgroundColor: "#E2535C", // Button(I've disabled AdBlock) background color
    btnColor:"#ffffff", // Button(I've disabled AdBlock) font color
    titleColor: "#000000", // Title color of popup
    descColor: "#000000", // Description color of popup
    helpTextColor: "#000000", // Help Text(How do I disable my adblocker?/Okay, I understand!) color of popup
    screenTwoStepsColor: "#000000", // Screen two ad block disable steps color
    titleText:"AdBlock Detected!", // Popup title Text
    descText:"It looks like you have an adblocker enabled. In order to support our website and continue accessing our content, please disable your ad blocker for this site.", // Popup description text
    btnText:"I've disabled AdBlock", // Button(I've disabled AdBlock) text
    screenOneHelpText: "How do I disable my adblocker?", // Screen one toggle helper text
    screenTwoHelpText: "Okay, I understand!", // Screen toggle toggle helper text
    screenTwoTitle : "To disable adblocker on this site:", // Screen two title text
    screenTwoSteps : [ // Screen two adblock disable steps text
      'Click on the adblocker extension icon located at the top right corner of your browser', 
      'From the menu choose "Disable on this site" or "Pause on this site"', 
      'Refresh the page if not automatically refreshed'
    ],
    onDetected:function(){}, // Callback function which runs if ad blocker is detected
    onDisabledAdblockBtnClick:function(){}, // Callback function which runs on button(I'have disabled AdBlock) click
    onCloseIconClick:function(){} // Callback function which runs on close icon click (if: showCloseIcon: true)
  };
      this.options = extend(config, options);
    }
    /**
       * Plugin prototype
       * @public
       * @constructor
       */
    async init() {

      const isDivTestSuccessful = performDivTest();
      if (isDivTestSuccessful) {
        constructModal(this.options);
        return;
      }

      const isBasicScriptTestSuccessful = await performBasicScriptTest();
      if (isBasicScriptTestSuccessful) {
        constructModal(this.options);
        cleanDocument();
        return;
      }

      const isAdvScriptTestSuccessful = await performAdvScriptTest();
      if (isAdvScriptTestSuccessful) {
        constructModal(this.options);
      }
      cleanDocument();
    }
  }

  return Plugin;
});

// Create instance of plugin
const abDetectorPro = new ABDetector()

// face icon 
const faceIcon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="256" height="256" viewBox="0 0 256 256" xml:space="preserve"><defs></defs><g style="stroke:none;stroke-width:0;stroke-dasharray:none;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:10;fill:none;fill-rule:nonzero;opacity:1" transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)"><path d="M 45 90 C 20.187 90 0 69.813 0 45 C 0 20.187 20.187 0 45 0 c 24.813 0 45 20.187 45 45 C 90 69.813 69.813 90 45 90 z M 45 7 C 24.047 7 7 24.047 7 45 s 17.047 38 38 38 s 38 -17.047 38 -38 S 65.953 7 45 7 z" style="stroke:none;stroke-width:1;stroke-dasharray:none;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:10;fill-rule:nonzero;opacity:1" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><circle cx="30.85" cy="33.68" r="7" style="stroke:none;stroke-width:1;stroke-dasharray:none;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:10;fill-rule:nonzero;opacity:1" transform="  matrix(1 0 0 1 0 0) "/><circle cx="59.15" cy="33.68" r="7" style="stroke:none;stroke-width:1;stroke-dasharray:none;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:10;fill-rule:nonzero;opacity:1" transform="  matrix(1 0 0 1 0 0) "/><path d="M 61.691 65.942 c -0.778 0 -1.563 -0.259 -2.212 -0.789 c -4.136 -3.379 -9.143 -5.165 -14.479 -5.165 s -10.344 1.786 -14.479 5.164 c -1.496 1.224 -3.702 1.002 -4.925 -0.495 s -1.001 -3.702 0.496 -4.925 c 5.322 -4.35 12.038 -6.744 18.908 -6.744 s 13.585 2.395 18.907 6.743 c 1.497 1.224 1.72 3.429 0.497 4.925 C 63.712 65.504 62.706 65.942 61.691 65.942 z" style="stroke:none;stroke-width:1;stroke-dasharray:none;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:10;fill-rule:nonzero;opacity:1" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/></g></svg>'

// hand icon 
const handIcon = '<svg width="800px" height="800px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>AdBlock icon</title><path d="M7.775 0a1.8 1.8 0 0 0-1.273.527L.528 6.503A1.8 1.8 0 0 0 0 7.775v8.45c0 .478.19.936.528 1.274l5.974 5.974A1.8 1.8 0 0 0 7.775 24h8.45a1.8 1.8 0 0 0 1.273-.527l5.975-5.974A1.8 1.8 0 0 0 24 16.225v-8.45a1.8 1.8 0 0 0-.527-1.272L17.498.527A1.8 1.8 0 0 0 16.225 0zm4.427 3c1.02 0 .958 1.108.958 1.108v6.784s-.009.218.16.218c.188 0 .175-.226.175-.226l-.002-5.63s-.05-.986.959-.986c1.01 0 .97.983.97.983v7.621s.014.158.141.158c.127 0 .944-2.122.944-2.122s.451-1.497 2.576-1.1c.038.008-.167.688-.167.688l-2.283 6.556S15.69 20.7 11.714 20.7c-5.044 0-4.808-5.407-4.814-5.405V7.562s-.016-.99.897-.99c.858 0 .849.99.849.99l.007 3.583s-.004.172.167.172c.16 0 .141-.172.141-.172l.01-5.926s-.055-1.162.966-1.162c1.04 0 .983 1.142.983 1.142v5.611s-.005.204.152.204c.168 0 .154-.206.154-.206l.01-6.693S11.18 3 12.202 3Z"/></svg>'

// ad icon
const adIcon = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 122.88 122.88" style="enable-background:new 0 0 122.88 122.88" xml:space="preserve"><g><path d="M61.44,0c8.31,0,16.24,1.66,23.49,4.66c7.53,3.12,14.29,7.68,19.96,13.34s10.22,12.43,13.34,19.96 c3,7.24,4.66,15.18,4.66,23.49c0,8.31-1.66,16.24-4.66,23.49c-3.12,7.53-7.68,14.29-13.34,19.96 c-5.66,5.66-12.43,10.22-19.96,13.34c-7.24,3-15.18,4.66-23.49,4.66c-8.31,0-16.24-1.66-23.49-4.66 c-7.53-3.12-14.29-7.68-19.96-13.34C12.34,99.22,7.78,92.45,4.66,84.93C1.66,77.68,0,69.75,0,61.44c0-8.31,1.66-16.24,4.66-23.49 C7.78,30.43,12.34,23.66,18,18c5.66-5.66,12.43-10.22,19.96-13.34C45.2,1.66,53.13,0,61.44,0L61.44,0z M52.15,70.86h-9.84 l-1.41,4.63h-8.86l10.58-28.1h9.5l10.53,28.1h-9.09L52.15,70.86L52.15,70.86z M50.31,64.78l-3.07-10.1l-3.08,10.1H50.31 L50.31,64.78z M64.27,47.39h12.91c2.54,0,4.6,0.35,6.16,1.03c1.56,0.69,2.86,1.68,3.89,2.97c1.02,1.3,1.76,2.79,2.22,4.51 c0.46,1.71,0.69,3.53,0.69,5.44c0,3-0.34,5.33-1.03,6.99c-0.68,1.65-1.63,3.04-2.85,4.16c-1.22,1.12-2.52,1.86-3.91,2.24 c-1.9,0.51-3.63,0.77-5.17,0.77H64.27V47.39L64.27,47.39z M72.94,53.75v15.35h2.13c1.82,0,3.11-0.2,3.89-0.6 c0.77-0.41,1.37-1.11,1.81-2.11c0.44-1.01,0.65-2.63,0.65-4.88c0-2.98-0.48-5.01-1.46-6.11c-0.97-1.1-2.59-1.65-4.85-1.65H72.94 L72.94,53.75z M102.19,31.54L89.95,43.79l-11.11-4.31l16-16c-4.3-3.8-9.25-6.86-14.65-9.02c-5.78-2.31-12.11-3.57-18.74-3.57 c-6.84,0-13.36,1.36-19.31,3.82c-6.18,2.56-11.74,6.32-16.41,10.98c-4.66,4.66-8.42,10.23-10.98,16.41 c-2.46,5.94-3.82,12.46-3.82,19.31c0,6.62,1.27,12.93,3.57,18.71c2.16,5.42,5.23,10.38,9.02,14.68l12.21-12.21l12.17,3.26 l-16.32,16.32c3.99,2.93,8.43,5.29,13.18,6.95c5.22,1.83,10.83,2.82,16.68,2.82c6.84,0,13.36-1.36,19.31-3.82 c6.18-2.56,11.74-6.32,16.41-10.98c4.66-4.66,8.42-10.23,10.98-16.41c2.46-5.94,3.82-12.46,3.82-19.31 c0-5.87-0.99-11.48-2.81-16.69C107.48,39.97,105.12,35.54,102.19,31.54L102.19,31.54z"/></g></svg>'

// close icon
const closeIcon = `<svg width="800px" height="800px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="#000000" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm0 393.664L407.936 353.6a38.4 38.4 0 1 0-54.336 54.336L457.664 512 353.6 616.064a38.4 38.4 0 1 0 54.336 54.336L512 566.336 616.064 670.4a38.4 38.4 0 1 0 54.336-54.336L566.336 512 670.4 407.936a38.4 38.4 0 1 0-54.336-54.336L512 457.664z"/></svg>`