define(function() {
  
  function SelectionOperation() {

  }
  
  SelectionOperation.prototype.begin = function(widget, select, appendSelection) {
    if (select) {
      this.surface.selectWidgets([widget], appendSelection);
    } else {
      this.surface.deselectWidgets([widget]);
    }
    this.surface.finishOperation(this);
  }
  
  SelectionOperation.prototype.finish = function() {
    
  }
  
  SelectionOperation.prototype.cancel = function() {
    
  }
  
  return {
    install: function(surface) {
      
      function handleWidgetSelected(event) {
        if (!surface.hasOperation() && (!surface.isWidgetSelected(event.detail.widget) || event.detail.mouseEvent.ctrlKey)) {
          surface.beginOperation(SelectionOperation, event.detail.widget, !surface.isWidgetSelected(event.detail.widget), event.detail.mouseEvent.ctrlKey);
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
