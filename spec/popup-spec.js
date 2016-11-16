describe('Popup', function(){

  var alertListElement,
    alertValueInputElement,
    alertListContainerElement,
    alertListItems,
    currentUSDValueElement,
    currentUSDValueVariationElement,
    saveButtonElement,
    linkCreditElement,
    insertAlert,
    buildInsertAlertEvent,
    getAlertListItems,
    stubCurrentUSDValueRequestReturn,
    mockCurrentUSDValueReponse,
    init;

  beforeEach(function(){
    var fixtures =  '<input data-js="alert-value">' +
                    '<button data-js="button-save" type="button"></button>' +
                    '<span data-js="currency-current-value"></span>' +
                    '<span data-js="currency-current-value-variation"></span>' +
                    '<div data-js="alert-list-container" class="is-hidden">' +
                      '<ul data-js="alert-list"></ul>' +
                    '</div>' +
                    '<span data-js="link-credit"></span>';
    setFixtures(fixtures);

    alertListElement = $('[data-js="alert-list"]');
    alertValueInputElement = $('[data-js="alert-value"]');
    alertListContainerElement = $('[data-js="alert-list-container"]');
    currentUSDValueElement = $('[data-js="currency-current-value"]');
    currentUSDValueVariationElement = $('[data-js="currency-current-value-variation"]');
    saveButtonElement = $('[data-js="button-save"]');
    linkCreditElement = $('[data-js="link-credit"]');

    insertAlert = function(alertValue, eventType, shouldSimulateEnterKey, avoidSaveButtonClick){
      eventType = eventType || 'change';
      var evt = buildInsertAlertEvent(eventType, shouldSimulateEnterKey);
      alertValueInputElement.val(alertValue).trigger(evt);
      if(!avoidSaveButtonClick)
        saveButtonElement.trigger('click');
    };

    buildInsertAlertEvent = function(eventType, shouldSimulateEnterKey){
      var evt = $.Event(eventType);
      if(shouldSimulateEnterKey)
        evt.keyCode = 13;
      return evt;
    };

    getAlertListItems = function(){
      return $('li', alertListElement);
    };

    stubCurrentUSDValueRequestReturn = function(){
      var promise = $.Deferred();
      spyOn(currencyService, 'getCurrentUSDValue').and.returnValue(promise);
      return promise;
    };

    mockCurrentUSDValueReponse = function(promise, status, value, variation){
      if(status == 'success')
        promise.resolve({
          currentValue: value,
          currentVariation: variation + '%'
        });
      else
        promise.reject();
    };

    init = function(){
      popup.init();
    };

    spyOn(chromeService.storage, 'addAlert');
    spyOn(chromeService.storage, 'removeAlert');
  });

  it('should add alerts', function(){
    init();
    insertAlert('3,60');
    expect(getAlertListItems().length).toEqual(1);
    expect(chromeService.storage.addAlert).toHaveBeenCalledWith(3.6);
    insertAlert('3,45');
    expect(getAlertListItems().length).toEqual(2);
    expect(chromeService.storage.addAlert).toHaveBeenCalledWith(3.45);
  });

  it('should add alert when pressing enter after valid value entered', function(){
    init();
    insertAlert('3,05', 'keypress', true, true);
    expect(saveButtonElement.hasClass('is-disabled')).toEqual(true);
    expect(getAlertListItems().length).toEqual(1);
  });

  it('should not add alert when pressing enter after invalid value entered', function(){
    init();
    insertAlert('asd', 'keypress', true, true);
    expect(saveButtonElement.hasClass('is-disabled')).toEqual(true);
    expect(getAlertListItems().length).toEqual(0);
  });

  it('should not add alert when pressing key other than enter while entering value', function(){
    init();
    insertAlert('3,05', 'keypress', false, true);
    expect(saveButtonElement.hasClass('is-disabled')).toEqual(false);
    expect(getAlertListItems().length).toEqual(0);
  });

  it('should show alert list container when some alert is added', function(){
    init();
    insertAlert('3,60');
    expect(alertListContainerElement.hasClass('is-hidden')).toEqual(false);
  });

  it('should add an alert containing a self remove trigger label', function(){
    init();
    insertAlert('3,55');
    expect($('span', getAlertListItems()[0])[0].innerHTML).toEqual('Remove');
  });

  it('should add an alert containing a custom attribute for alert value', function(){
    init();
    insertAlert('3,23');
    expect($(getAlertListItems()[0]).attr('data-alert-value')).toEqual('3.23');
  });

  it('should add an alert containing the alert value as text', function(){
    init();
    insertAlert('3,3');
    expect($('span', getAlertListItems()[0])[1].innerHTML).toEqual('3.30');
  });

  it('should remove an existing alert', function(){
    init();
    insertAlert('3,35');
    insertAlert('3,65');
    insertAlert('3,75');
    alertListItems = getAlertListItems();
    $(alertListItems[1]).trigger('click');
    expect(chromeService.storage.removeAlert).toHaveBeenCalledWith('3.65');
  });

  it('should hide alert list container on popup initialisation when there is no alert saved', function(){
    spyOn(chromeService.storage, 'getAlerts').and.returnValue({
      then: function(callback){
        callback([]);
      }
    });

    init();
    expect(alertListContainerElement.hasClass('is-hidden')).toEqual(true);
  });

  it('should hide alert list container when last alert is removed', function(){
    init();
    insertAlert('3,35');
    alertListItems = getAlertListItems();
    $(alertListItems[0]).trigger('click');
    expect(alertListContainerElement.hasClass('is-hidden')).toEqual(true);
  });

  it('should show loading message when getting USD current value', function(){
    stubCurrentUSDValueRequestReturn();
    init();
    expect(currentUSDValueElement.text()).toEqual('Loading value...');
  });

  it('show show current USD exchange value on initialisation', function(){
    var promise = stubCurrentUSDValueRequestReturn();

    init();
    mockCurrentUSDValueReponse(promise, 'success', 3.65, 1.2);
    expect(currentUSDValueElement.text()).toEqual('3.65');
  });

  it('should show fail message when is not possible get current USD value on initialisation', function(){
    var promise = stubCurrentUSDValueRequestReturn();

    init();
    promise.reject();
    expect(currentUSDValueElement.text()).toEqual('Failed to get current USD value');
  });

  it('should show current USD value positive variation properly styled on initialisation', function(){
    var promise = stubCurrentUSDValueRequestReturn();

    init();
    mockCurrentUSDValueReponse(promise, 'success', 3.30, 2.35);
    expect(currentUSDValueVariationElement.text()).toEqual('2.35%');
    expect(currentUSDValueVariationElement.hasClass('is-positive')).toEqual(true);
    expect(currentUSDValueVariationElement.hasClass('is-negative')).toEqual(false);
  });

  it('should show current USD value negative variation properly styled on initialisation', function(){
    var promise = stubCurrentUSDValueRequestReturn();

    init();
    mockCurrentUSDValueReponse(promise, 'success', 3.03, -1.3);
    expect(currentUSDValueVariationElement.text()).toEqual('-1.3%');
    expect(currentUSDValueVariationElement.hasClass('is-positive')).toEqual(false);
    expect(currentUSDValueVariationElement.hasClass('is-negative')).toEqual(true);
  });

  it('should add previously saved alerts into alert list on initialisation', function(){
    var promise = $.Deferred();
    spyOn(chromeService.storage, 'getAlerts').and.returnValue(promise);

    init();
    promise.resolve([3.35, 2.98]);
    alertListItems = getAlertListItems();
    expect(alertListItems.length).toEqual(2);
  });

  it('should open author\'s website when clicking on credit link', function(){
    spyOn(window, 'open');

    init();
    linkCreditElement.trigger('click');
    expect(window.open).toHaveBeenCalledWith('https://www.rafaelcamargo.com', '_blank');
  });

  it('should show save button disabled on initialisation', function(){
    init();
    expect(saveButtonElement.hasClass('is-disabled')).toEqual(true);
  });

  it('should keep save button disabled when invalid values are entered', function(){
    init();
    insertAlert('asd');
    expect(saveButtonElement.hasClass('is-disabled')).toEqual(true);
    insertAlert('!@#$');
    expect(saveButtonElement.hasClass('is-disabled')).toEqual(true);
  });

  it('should enable save button when a valid value is entered', function(){
    init();
    insertAlert('3,05');
    expect(saveButtonElement.hasClass('is-disabled')).toEqual(false);
  });

});
