/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the browser component of seb.
 *
 * The Initial Developer of the Original Code is Stefan Schneider <schneider@hrz.uni-marburg.de>.
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Stefan Schneider <schneider@hrz.uni-marburg.de>
 *   
 * ***** END LICENSE BLOCK ***** */

/* ***** GLOBAL seb SINGLETON *****

* *************************************/ 

/* 	for javascript module import
	see: https://developer.mozilla.org/en/Components.utils.import 
*/

this.EXPORTED_SYMBOLS = ["SebServer"];

/* Modules */
const 	{ classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components,
	{ scriptloader } = Cu.import("resource://gre/modules/Services.jsm").Services;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

/* Services */

/* SebGlobals */
scriptloader.loadSubScript("resource://globals/prototypes.js");

/* SebModules */
XPCOMUtils.defineLazyModuleGetter(this,"sl","resource://modules/SebLog.jsm","SebLog");
XPCOMUtils.defineLazyModuleGetter(this,"su","resource://modules/SebUtils.jsm","SebUtils");
XPCOMUtils.defineLazyModuleGetter(this,"sh","resource://modules/SebHost.jsm","SebHost");

/* ModuleGlobals */
let 	base = null,
	seb = null,
	sebserverEnabled = false,
	sebserver = null,
	sebserverSocketBrowser = null,
	sebserverSocketWin = null,
	sebserverSocket = null;
	
this.SebServer = {
	handler : {},
		
	init : function(obj) {
		base = this;
		seb = obj;
		sl.out("SebServer initialized: " + seb);
		base.handler["shutdown"] = base.shutdown;
		base.handler["sendScreenshotData"] = base.sendScreenshotData;
	},
	
	sebserverSocketListener : function (e) {
		sl.debug("sebserverSocketListener");
		sebserverSocketWin = sebserverSocketBrowser.contentWindow.wrappedJSObject;
		const { WebSocket } = sebserverSocketWin;
		try {
			sebserverSocket = new WebSocket(sebserver.socket);
			sebserverSocket.binaryType = "blob";
			sebserverSocket.onopen = base.onOpen;
			sebserverSocket.onclose = base.onClose;
			sebserverSocket.onerror = base.onError;
			sebserverSocket.onmessage = base.onMessage;
			//sl.debug("sebserverSocket: " + typeof sebserverSocket)
		}
		catch (e) {
			sl.debug("sebserverSocket connection failed: " + sebserver.socket + "\n"+e);
			sebserverSocket = null;
			return; 
		}
		/*
		
		//const { BinaryClient } = hiddenWin;
		sebBinaryClient = new sebserverSocketWin.BinaryClient(sebServer.socket);
		
		//client = hiddenWin.bc(server.socket); 
		sebBinaryClient.on('open', function() { x.debug("websocket connection established to " + sebServer.socket + ".") });
		sebBinaryClient.on('error', function(err) { x.debug("websocket error: " + err) });
		sebBinaryClient.on('close', function(err) { x.debug("websocket closed.") });
		sebBinaryClient.on('stream', on_client_stream );
		*/
	},
	
	setSebserverSocketHandler : function(win) {
		sl.debug("setSebserverSocketHandler");
		sebserverEnabled = su.getConfig("sebServerEnabled","boolean",false);
		if (!sebserverEnabled) { sl.debug("sebserver disabled"); return; }
		sebserver = su.getConfig("sebServer","object",null);
		if (sebserver === null) { sl.debug("no sebserver configured"); return; }
		if (!sebserver["url"] || !sebserver["socket"]) { sl.debug("no sebserver url or socket configured"); return; }
		sebserverSocketBrowser = win.document.getElementById("sebserver.socket");
		sebserverSocketBrowser.addEventListener("DOMContentLoaded",base.sebserverSocketListener, true);
		sebserverSocketBrowser.setAttribute("src", sebserver.url);
		sl.debug("set sebserver: " + JSON.stringify(sebserver));
	},
	
	onOpen : function() {
		sl.debug("socket client: onOpen"); 
		//sebserverSocket.send("seb: onOpen");
	},
	
	onClose : function() {
		sl.debug("socket client: onClose"); 
		//sebserverSocket.send("seb: onClose");
	},
	
	onError : function(error) {
		sl.debug("socket client: onError: " + error); 
	},
	
	onMessage : function(e) {
		sl.debug("socket client: onMessage"); 
		//log("on_message: " + e.data);
		let obj = JSON.parse(e.data);
		let h = base.handler[obj.handler];
		if (typeof h === 'function') {
			h.apply(undefined, [obj.opts]);
		} 	
	},
	
	shutdown : function(seb) {
		sl.debug("socket client: shutdown: " + seb.id); 
		sh.shutdown();
	},
	
	sendScreenshotData : function(file) {
		sc.sendScreenshotData(file);
	},
	
	send : function(obj) {
		if (sebserverSocket != null) {
			try {
				//sl.debug(sebserverSocket.binaryType);
				//sebserverSocket.extensions["test"] = JSON.stringify({"bla":"blub"});
				sebserverSocket.send(obj);
				
			}
			catch(e) { sl.err(e) }
		}
	} 
}
