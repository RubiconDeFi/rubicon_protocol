
module.exports = (function () {
  
  var instance;
 
  function init(initialNonce = 0, nonceUpdateFunction) {
    
    var nonce = initialNonce;
    var lastUsage = new Date();
    var permissionQueue = [];
    var locked = false;
    var nonceFunction = nonceUpdateFunction;

    var resolvePermissions = () => {
    	for(var i in permissionQueue) {
    		permissionQueue[i]();
    	}
    	permissionQueue = [];
    };


    var autoUpdate = function() {
    	locked = true;
    	// after no usage for > 10 seconds sync nonce
    	if(Math.floor((new Date() - lastUsage) / 1000) > 10) {
            nonceFunction().then((newNonce) => {
        		nonce = newNonce;
        		locked = false;
        		resolvePermissions();
                setTimeout(autoUpdate, 1000);
        	})
    	} else {
    		locked = false;
    		resolvePermissions();
            setTimeout(autoUpdate, 1000);
    	}

        
    };

    setTimeout(autoUpdate, 1000);

    return {
        
      getNextNonce: function getNextNonce(){
        nonce = nonce + 1;
        lastUsage = new Date();
        return nonce;
      },

      getTransactionPermission : function getTransactionPermission(){

      	// no problem just go
      	if(!locked) {
      		return Promise.resolve();
      	} else {
      		// put into queue
      		var promise = new Promise((resolve, reject) => {
	      		permissionQueue.push(resolve);
	      	});
	      	
	      	return promise;
      	}g

      },

      updateNonce : function updateNonce(nonceFunction) {
      	locked = true;
      	nonceFunction().then((newNonce) => {
      		nonce = newNonce;
      		locked = false;
      		resolvePermissions();
      	})
      }

    };


    

  };
 
  return {

    getInstance: function (initialNonce = 0, nonceUpdateFunction = null) {
      if (!instance) {
        instance = init(initialNonce, nonceUpdateFunction);
      }
      return instance;
    }
  };
})();
