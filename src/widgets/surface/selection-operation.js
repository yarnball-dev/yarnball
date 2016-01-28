define(function() {
  
  function SelectionOperation() {

  }
  
  SelectionOperation.prototype.begin = function(mouseEvent, widget) {
    this.surface.selectWidgets([widget], mouseEvent.ctrlKey);
    this.surface.finishOperation(this);
  }
  
  SelectionOperation.prototype.finish = function() {
    
  }
  
  SelectionOperation.prototype.cancel = function() {
    
  }
  
  return {
    install: function(surface) {
      
      function handleWidgetSelected(event) {
        if (!surface.hasOperation()) {
          if (!surface.isWidgetSelected(event.detail.widget)) {
            surface.beginOperation(SelectionOperation, event.detail.mouseEvent, event.detail.widget);
          }
        }
      }
      
      surface.addEventListener('widgetAttached', function(event) {
        event.detail.addEventListener('selected', handleWidgetSelected);
      });
      surface.addEventListener('widgetDetached', function(event) {
        event.detail.removeEventListener('selected', handleWidgetSelected);
      });
    }
  }
  
});
