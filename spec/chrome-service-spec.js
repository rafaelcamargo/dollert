describe('Chrome Service', function(){

  var SUCCESS_GET_ALARM_RESPONSE = {
    id: 36,
    value: '63'
  };

  beforeEach(function(){
    spyOn(chrome.alarms, 'get');
    spyOn(chrome.alarms, 'clear');
  });

  it('should provide an interface to alarms api', function(){
    expect(chromeService.alarms).toBeDefined();
  });

  it('should provide an interface to storage api', function(){
    expect(chromeService.storage).toBeDefined();
  });

  it('should create an alarm', function(){
    spyOn(chrome.alarms, 'create');

    chromeService.alarms.create(36, {
      value: '63'
    });
    expect(chrome.alarms.create).toHaveBeenCalledWith(36, {
      value: '63'
    });
  });

  it('should add an alarm listener', function(){
    spyOn(chrome.alarms.onAlarm, 'addListener');

    var callback = function(){};
    chromeService.alarms.addListener(callback);
    expect(chrome.alarms.onAlarm.addListener).toHaveBeenCalledWith(callback);
  });

  it('should get an alarm with a given callback', function(){
    var callback = function(){};
    chromeService.alarms.get(36, callback);
    expect(chrome.alarms.get).toHaveBeenCalledWith(36, callback);
  });

  it('should get an alarm without a given callback', function(){
    chromeService.alarms.get(36);
    expect(chrome.alarms.get).toHaveBeenCalledWith(36, jasmine.any(Function));
  });

  it('should return a promise when getting an alarm', function(){
    var promise = chromeService.alarms.get(36);
    expect(promise.reject).toBeDefined();
    expect(promise.resolve).toBeDefined();
  });

  it('should resolve a promise on getting an alarm when no callback have been given ', function(){
    chrome.alarms.get = function(id, callback){
      callback(SUCCESS_GET_ALARM_RESPONSE);
    };

    var alarm;
    var promise = chromeService.alarms.get(36);

    promise.then(function(response){
      alarm = {
        id: response.id,
        value: response.value
      };
    });

    expect(alarm.id).toEqual(36);
    expect(alarm.value).toEqual('63');
  });

  it('should clear an alarm with a given id and a callback', function(){
    var callback = function(){};
    chromeService.alarms.clear(36, callback);
    expect(chrome.alarms.clear).toHaveBeenCalledWith(36, callback);
  });

  it('should clear an alarm with just a given id', function(){
    chromeService.alarms.clear(36);
    expect(chrome.alarms.clear).toHaveBeenCalledWith(36, jasmine.any(Function));
  });

  it('should return nothing when clearing an alarm with no callback given', function(){
    chrome.alarms.clear = function(id, callback){
      callback();
    };

    var blankReturn = chromeService.alarms.clear(36);
    expect(blankReturn).toEqual(undefined);
  });

  it('should provide an interface to storage api', function(){
    expect(chromeService.storage).toBeDefined();
  });

  it('should get an item from storage', function(){
    var item = {value: '36'};
    var callback = function(){};
    spyOn(chromeService.storage, 'handleStorage');

    chromeService.storage.get(item, callback);
    expect(chromeService.storage.handleStorage).toHaveBeenCalledWith('get', item, callback);
  });

  it('should set an item to storage', function(){
    var item = {value: '36'};
    var callback = function(){};
    spyOn(chromeService.storage, 'handleStorage');

    chromeService.storage.set(item, callback);
    expect(chromeService.storage.handleStorage).toHaveBeenCalledWith('set', item, callback);
  });

  it('should call some storage sync method with a placeholder callback if none is provided', function(){
    chrome.storage.sync.set = function(item, callback){
      callback();
    };
    spyOn(chrome.storage.sync, 'set').and.callThrough();
    var item = {dollerts: [3.60]};

    chromeService.storage.handleStorage('set', item);
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(item, jasmine.any(Function));
  });

  it('should remove an item from storage', function(){
    var item = {value: '36'};
    var callback = function(){};
    spyOn(chromeService.storage, 'handleStorage');

    chromeService.storage.remove(item, callback);
    expect(chromeService.storage.handleStorage).toHaveBeenCalledWith('remove', item, callback);
  });

  it('should answer if an alert was already saved', function(){
    var previousValues = [3.2,3.5,3.6];
    var currentValue = 3.5;

    expect(chromeService.storage.isAlertAlreadySaved(previousValues, currentValue)).toBeTruthy();

    currentValue = 3.7;
    expect(chromeService.storage.isAlertAlreadySaved(previousValues, currentValue)).toBeFalsy();
  });

  it('should add an alert when it is not already stored', function(){
    spyOn(chromeService.storage, 'set');
    chromeService.storage.get = function(item, callback){
      callback();
    };

    chromeService.storage.addAlert(3.35);
    expect(chromeService.storage.set).toHaveBeenCalledWith({
      dollerts: [3.35]
    });
  });

  it('should note add an alert when it is already stored', function(){
    spyOn(chromeService.storage, 'set');
    chromeService.storage.get = function(item, callback){
      callback({
        dollerts: [3.60]
      });
    };

    chromeService.storage.addAlert(3.60);
    expect(chromeService.storage.set).toHaveBeenCalledWith({
      dollerts: [3.60]
    });
  });

  it('should remove an alert keeping with the existing ones', function(){
    spyOn(chromeService.storage, 'set');
    chromeService.storage.get = function(item, callback){
      callback({
        dollerts: [3.60, 3.25, 3.30]
      });
    };

    chromeService.storage.removeAlert(3.25);
    expect(chromeService.storage.set).toHaveBeenCalledWith({
      dollerts: [3.60, 3.30]
    });
  });

  it('should clear storage when removing last alert', function(){
    var storageKey = chromeService.storage.defaultKey;
    spyOn(chromeService.storage, 'remove');
    chromeService.storage.get = function(item, callback){
      callback({
        dollerts: [3.60]
      });
    };

    chromeService.storage.removeAlert(3.60);
    expect(chromeService.storage.remove).toHaveBeenCalledWith(storageKey);
  });

  it('should get existing alerts', function(){
    var existingAlerts;
    chromeService.storage.get = function(item, callback){
      callback({
        dollerts: [3.60, 3.40, 3.15]
      });
    };

    chromeService.storage.getAlerts().then(function(alerts){
      existingAlerts = alerts;
    });

    expect(existingAlerts).toEqual([3.60, 3.40, 3.15]);
  });

  it('should show notification from a USD value', function(){
    window.Notification = function(title, options){};
    spyOn(window, 'Notification');

    chromeService.notification.show(3.65);
    expect(Notification).toHaveBeenCalledWith('1 USD = 3.65 BRL', {
      icon: 'icon_128x128.png'
    });
  });

});
