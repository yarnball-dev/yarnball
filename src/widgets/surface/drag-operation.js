define(function() {
  
  function DragOperation() {

  }
  
  DragOperation.prototype.begin = function(event) {
    
    var self = this;
    
    var surface = self.surface;
    
    if (event.detail.shiftKey) {
      surface.copySelected();
    }

    var draggingNodeWidgets = new Set(surface.selectedNodeWidgets);
    
    if (draggingNodeWidgets.size) {
      surface.classList.add('dragging-nodes');
    }
    
    // Initialize widget drag start positions
    draggingNodeWidgets.forEach(function(nodeWidget) {
      nodeWidget.dragStartPosition = surface.getNodePosition(nodeWidget);
      nodeWidget.classList.add('dragging');
    });
    surface.selectedSetWidgets.forEach(function(setWidget) {
      setWidget.dragStartPosition = setWidget.position;
    });
    
    
    // Setup drag-drop
    
    var dragdropAreasToDraggingNodes = new Map();
    draggingNodeWidgets.forEach(function(nodeWidget) {
      if (!surface.nodeWidgetsTopLevel.has(nodeWidget)) {
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
        surface.attachNodeWidget(nodeWidget, nodeWidget.dragStartPosition);
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
      
        var topLevelDraggingWidgets = Array.from(draggingNodeWidgets).filter(function(nodeWidget) {
          return surface.nodeWidgetsTopLevel.has(nodeWidget);
        });
        
        var detachedWidgets = Array.from(topLevelDraggingWidgets).map(function(nodeWidget) {
          return surface.detachNodeWidget(nodeWidget);
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
      dragdropArea.fire('nodes-dropped', draggingNodeWidgets);
      draggingNodeWidgets.forEach(function(nodeWidget) {
        nodeWidget.style.left = nodeWidget.dragStartPosition.x + 'px';
        nodeWidget.style.top  = nodeWidget.dragStartPosition.y + 'px';
        surface.updateConnectorsForNodeWidget(nodeWidget);
      });
      this.updateStyles();
    }
    
    surface.dragdropAreas.forEach(function(dragdropArea) {
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
        draggingNodeWidgets.forEach(function(draggingNodeWidget) {
        
          if (surface.nodeWidgetsTopLevel.has(draggingNodeWidget)) {
        
            var newPos = {
              x: draggingNodeWidget.dragStartPosition.x + options.dragDeltaView.x,
              y: draggingNodeWidget.dragStartPosition.y + options.dragDeltaView.y,
            }
            
            draggingNodeWidget.style.left = newPos.x + 'px';
            draggingNodeWidget.style.top  = newPos.y + 'px';
          
            surface.updateConnectorsForNodeWidget(draggingNodeWidget);
          }
        });
        
        // Move set widgets
        surface.selectedSetWidgets.forEach(function(selectedSetWidget) {
          
          var newPos = {
            x: selectedSetWidget.dragStartPosition.x + options.dragDeltaView.x,
            y: selectedSetWidget.dragStartPosition.y + options.dragDeltaView.y,
          }
          
          selectedSetWidget.style.left = newPos.x + 'px';
          selectedSetWidget.style.top  = newPos.y + 'px';
          selectedSetWidget.position = newPos;
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
    
        draggingNodeWidgets.forEach(function(nodeWidget) {
          nodeWidget.classList.remove('dragging');
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
      
      surface.addEventListener('nodeWidgetAttached', function(event) {
        var nodeWidget = event.detail;
        nodeWidget.addEventListener('dragStart', function(event) {
          if (!surface.hasOperation()) {
            event.preventDefault();
            surface.beginOperation(DragOperation, event);
            return false;
          }
        });
      });
      
      surface.addEventListener('setWidgetAttached', function(event) {
        var setWidget = event.detail;
        setWidget.addEventListener('dragStart', function(event) {
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
