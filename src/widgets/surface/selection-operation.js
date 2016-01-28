define(function() {
  
  function SelectionOperation() {

  }
  
  SelectionOperation.prototype.begin = function(event, nodeWidget, setWidget) {
    if (nodeWidget) {
      this.surface.selectNodeWidgets([nodeWidget], event.detail.ctrlKey);
    }
    if (setWidget) {
      this.surface.selectSetWidgets([setWidget], event.detail.ctrlKey);
    }
    this.surface.finishOperation(this);
  }
  
  SelectionOperation.prototype.finish = function() {
    
  }
  
  SelectionOperation.prototype.cancel = function() {
    
  }
  
  return {
    install: function(surface) {
      
      surface.addEventListener('nodeWidgetAttached', function(event) {
        var nodeWidget = event.detail;
        nodeWidget.addEventListener('selected', function(event) {
          if (!surface.hasOperation()) {
            if (!surface.selectedNodeWidgets.has(nodeWidget)) {
              surface.beginOperation(SelectionOperation, event, nodeWidget);
            }
          }
        });
      });
      
      surface.addEventListener('setWidgetAttached', function(event) {
        var setWidget = event.detail;
        setWidget.addEventListener('selected', function(event) {
          if (!surface.hasOperation()) {
            if (!surface.selectedSetWidgets.has(setWidget)) {
              surface.beginOperation(SelectionOperation, event, null, setWidget);
            }
          }
        });
      });
    }
  }
  
});
