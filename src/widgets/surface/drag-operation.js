define(function() {
  
  function DragOperation() {

  }
  
  DragOperation.prototype.begin = function(event) {
    
    var self = this;
    
    var surface = self.surface;
    
    if (event.detail.shiftKey) {
      var newWidgets = surface.duplicateWidgets(surface.getSelectedWidgets());
      surface.selectWidgets(newWidgets);
    }

    var draggingWidgets     = surface.getSelectedWidgets();
    var draggingNodeWidgets = surface.getSelectedWidgetsOfType('yb-node');
    
    if (draggingNodeWidgets.size) {
      surface.classList.add('dragging-nodes');
    }
    
    // Initialize widget drag start positions
    draggingWidgets.forEach(function(nodeWidget) {
      nodeWidget.dragStartPosition = surface.getWidgetPosition(nodeWidget);
      nodeWidget.classList.add('dragging');
    });
    
    
    // Setup drag-drop
    
    var dragdropAreasToDraggingNodes = new Map();
    draggingNodeWidgets.forEach(function(nodeWidget) {
      if (!surface.isTopLevelWidget(nodeWidget)) {
        var dragdropArea = surface.getWidgetDragdropAreaParent(nodeWidget);
        if (dragdropArea) {
          if (dragdropAreasToDraggingNodes.has(dragdropArea)) {
            dragdropAreasToDraggingNodes.get(dragdropArea).add(nodeWidget);
          } else {
            dragdropAreasToDraggingNodes.set(dragdropArea, new Set([nodeWidget]));
          }
        }
      }
    });
    
    function handleDragdropAreaDraggedOut(event) {
      var draggingNodesForArea = dragdropAreasToDraggingNodes.get(event.detail.dragdropArea);
      event.detail.oldWidgets.forEach(function(nodeWidget) {
        draggingNodesForArea.delete(nodeWidget);
      });
      if (draggingNodesForArea.size === 0) {
        event.detail.dragdropArea.removeEventListener('widgetsDraggedOut', handleDragdropAreaDraggedOut);
        dragdropAreasToDraggingNodes.delete(event.detail.dragdropArea);
      }
      
      event.detail.detachedWidgets.forEach(function(nodeWidget) {
        surface.attachWidget(nodeWidget, nodeWidget.dragStartPosition);
      });
    }
    
    dragdropAreasToDraggingNodes.forEach(function(nodeWidgets, dragdropArea) {
      dragdropArea.fire('widgetDragStart', {
        widgets: nodeWidgets,
        mouseEvent: event.detail,
      });
      dragdropArea.addEventListener('widgetsDraggedOut', handleDragdropAreaDraggedOut);
    });
    
    function dragdropAreaMouseover(event) {
      var dragdropArea = event.currentTarget;
      dragdropArea.classList.add('drop-hover');
      
      if (dragdropArea.dropOnHover) {
      
        var widgetsToDrop = Array.from(draggingNodeWidgets).filter(function(nodeWidget) {
          return surface.isTopLevelWidget(nodeWidget);
        });
        
        if (dragdropArea.dropRequestHandler) {
          widgetsToDrop = dragdropArea.dropRequestHandler(widgetsToDrop);
        }
        
        var detachedWidgets = Array.from(widgetsToDrop).map(function(nodeWidget) {
          return surface.detachWidget(nodeWidget);
        });
        
        dragdropArea.fire('widgetsDraggedIn', {
          dragdropArea: dragdropArea,
          widgets: detachedWidgets,
          mouseEvent: event,
        });
        
        if (!dragdropAreasToDraggingNodes.has(dragdropArea)) {
          dragdropAreasToDraggingNodes.set(dragdropArea, new Set(detachedWidgets));
          dragdropArea.addEventListener('widgetsDraggedOut', handleDragdropAreaDraggedOut);
        } else {
          detachedWidgets.forEach(function(nodeWidget) {
            dragdropAreasToDraggingNodes.get(dragdropArea).add(nodeWidget);
          });
        }
      }
    }
    function dragdropAreaMouseout(event) {
      var dragdropArea = event.currentTarget;
      dragdropArea.classList.remove('drop-hover');
    }
    function dragdropAreaMouseup(event) {
      var dragdropArea = event.currentTarget;
      dragdropArea.classList.remove('drop-hover');
      var widgetsToDrop = draggingNodeWidgets;
      if (dragdropArea.dropRequestHandler) {
        widgetsToDrop = dragdropArea.dropRequestHandler(widgetsToDrop);
      }
      dragdropArea.fire('nodes-dropped', widgetsToDrop);
      
      draggingNodeWidgets.forEach(function(nodeWidget) {
        surface.setWidgetPosition(nodeWidget, nodeWidget.dragStartPosition);
      });
    }
    
    var dropTargets = Array.from(surface.getDragdropAreas()).filter(function(dragdropArea) {
      if (!dragdropArea.dropRequestHandler) {
        return true;
      }
      
      var allowedWidgets = dragdropArea.dropRequestHandler(draggingWidgets);
      return Array.from(allowedWidgets).length !== 0;
    });
    
    dropTargets.forEach(function(dragdropArea) {
      if (dragdropArea.enabled) {
        dragdropArea.addEventListener('mouseover', dragdropAreaMouseover);
        dragdropArea.addEventListener('mouseout',  dragdropAreaMouseout);
        dragdropArea.addEventListener('mouseup',   dragdropAreaMouseup);
        dragdropArea.classList.add('drop-ready');
      }
    });
    
    
    // Begin drag
    
    surface.captureMouse(event.detail, {
      cursor: '-webkit-grabbing',
      mousemove: function(options) {
      
        // Move top-level node widgets
        draggingWidgets.forEach(function(draggingWidget) {
        
          if (surface.isTopLevelWidget(draggingWidget) && !(draggingWidget.tagName === 'yb-connector'.toUpperCase())) {
        
            surface.setWidgetPosition(draggingWidget, {
              x: draggingWidget.dragStartPosition.x + options.dragDeltaView.x,
              y: draggingWidget.dragStartPosition.y + options.dragDeltaView.y,
            });
          }
        });
        
        // Move node widgets in drag-drop areas
        dragdropAreasToDraggingNodes.forEach(function(nodeWidgets, dragdropArea) {
          dragdropArea.fire('widgetDrag', {
            widgets: nodeWidgets,
            options: options,
          });
        });
        
        return false;
      },
      mouseup: function() {
      
        surface.classList.remove('dragging-nodes');
    
        draggingWidgets.forEach(function(widget) {
          widget.classList.remove('dragging');
        });
        
        surface.dragdropAreas.forEach(function(dragdropArea) {
          dragdropArea.removeEventListener('mouseover', dragdropAreaMouseover);
          dragdropArea.removeEventListener('mouseout',  dragdropAreaMouseout);
          dragdropArea.removeEventListener('mouseup',   dragdropAreaMouseup);
          dragdropArea.classList.remove('drop-ready');
        });
        
        dragdropAreasToDraggingNodes.forEach(function(nodeWidgets, dragdropArea) {
          dragdropArea.fire('widgetDragFinish', nodeWidgets);
          dragdropArea.removeEventListener('widgetsDraggedOut', handleDragdropAreaDraggedOut);
        });
        
        surface.finishOperation(self);
      }
    });
  }
  
  DragOperation.prototype.finish = function() {
    
  }
  
  DragOperation.prototype.cancel = function() {
    
  }
  
  return {
    install: function(surface) {
      
      surface.addEventListener('widgetAttached', function(event) {
        var widget = event.detail;
        widget.addEventListener('dragStart', function(event) {
          if (!surface.hasOperation()) {
            event.preventDefault();
            surface.beginOperation(DragOperation, event);
            return false;
          }
        });
      });
    }
  }
  
});
