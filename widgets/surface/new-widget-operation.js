define(function() {
  
  function NewWidgetOperation() {
    
  }
  
  NewWidgetOperation.prototype.begin = function(position) {
    this.nodeWidget = this.surface.createNodeWidget();
    this.surface.attachWidget(this.nodeWidget, {
      x: position.x - 28,
      y: position.y - 28,
    });
    
    this.surfaceWeb.addWidget(this.nodeWidget);
    this.surfaceWeb.setWidgetPosition(this.nodeWidget.widgetId, this.surface.getWidgetPosition(this.nodeWidget));
    
    this.surface.finishOperation(this);
  }
  
  NewWidgetOperation.prototype.finish = function(position) {
    
  }
  
  return {
    install: function(surface) {
      surface.NewWidgetOperation = NewWidgetOperation;
    },
  }
});