define(function() {
  
  function NewConnectorDragOperation() {

  }
  
  NewConnectorDragOperation.prototype.begin = function(event, nodeWidget) {
    var self = this;
    var surface = self.surface;
    
    if (!surface.selectedNodeWidgets.has(nodeWidget)) {
      surface.selectNodeWidgets([nodeWidget]);
    }
    
    var nodePos = surface.getNodePosition(nodeWidget);
    
    var cursorPos = {
      x: nodePos.x + event.detail.offsetX,
      y: nodePos.y + event.detail.offsetY,
    }

    surface.draggingConnectorNodes = {
      from: new Set(surface.selectedNodeWidgets),
      via:  null,
      to:   null,
    }
    
    var draggingConnectors = [];
    surface.draggingConnectorNodes.from.forEach(function(fromNodeWidget) {
      var draggingConnector = document.createElement('yb-connector');
      draggingConnector.classList.add('inactive');
      draggingConnector.classList.add('dragging');
      var nodeCenter = surface.getNodeWidgetCenter(fromNodeWidget);
      draggingConnector.set('fromPos', {
        x: nodeCenter.x + surface.viewMargin,
        y: nodeCenter.y + surface.viewMargin,
      });
      Polymer.dom(surface.viewRoot).appendChild(draggingConnector);
      draggingConnectors.push(draggingConnector);
    });
    
    function handleOtherNodeMouseover(event) {
      var otherNodeWidget = event.currentTarget;
      var otherNodeCenter = surface.getNodeWidgetCenter(otherNodeWidget);
      if (!surface.draggingConnectorNodes.via) {
        if (!surface.draggingConnectorNodes.from.has(otherNodeWidget)) {
          surface.draggingConnectorNodes.via = otherNodeWidget;
          draggingConnectors.forEach(function(draggingConnector) {
            draggingConnector.set('viaPos', {
              x: otherNodeCenter.x + surface.viewMargin,
              y: otherNodeCenter.y + surface.viewMargin,
            });
          });
        }
      } else if (!surface.draggingConnectorNodes.to) {
        if (otherNodeWidget !== surface.draggingConnectorNodes.via) {
          surface.draggingConnectorNodes.to = otherNodeWidget;
          draggingConnectors.forEach(function(draggingConnector) {
            draggingConnector.set('toPos', {
              x: otherNodeCenter.x + surface.viewMargin,
              y: otherNodeCenter.y + surface.viewMargin,
            });
          });
        }
      }
    }
    
    surface.nodeWidgetsTopLevel.forEach(function(otherNodeWidget) {
      if (!surface.draggingConnectorNodes.from.has(otherNodeWidget)) {
        otherNodeWidget.addEventListener('mouseover', handleOtherNodeMouseover);
      }
    });
    
    surface.classList.add('dragging-connectors');
    
    surface.captureMouse(event, {
      mousemove: function(options) {
        if (!surface.draggingConnectorNodes.via) {
          draggingConnectors.forEach(function(draggingConnector) {
            draggingConnector.set('viaPos', {
              x: options.currentPosView.x + surface.viewMargin,
              y: options.currentPosView.y + surface.viewMargin,
            });
          });
        } else if(!surface.draggingConnectorNodes.to) {
          draggingConnectors.forEach(function(draggingConnector) {
            draggingConnector.set('toPos', {
              x: options.currentPosView.x + surface.viewMargin,
              y: options.currentPosView.y + surface.viewMargin,
            });
          });
        }
      },
      mouseup: function() {
      
        surface.classList.remove('dragging-connectors');
      
        surface.nodeWidgetsTopLevel.forEach(function(otherNodeWidget) {
          if (!surface.draggingConnectorNodes.from.has(otherNodeWidget)) {
            otherNodeWidget.removeEventListener('mouseover', handleOtherNodeMouseover);
          }
        });
        
        if (surface.draggingConnectorNodes.via &&
            surface.draggingConnectorNodes.to) {
          
          var newLinks = [];
          
          surface.draggingConnectorNodes.from.forEach(function(fromNodeWidget) {
            var nodeWidgetTriple = {
              from: fromNodeWidget,
              via:  surface.draggingConnectorNodes.via,
              to:   surface.draggingConnectorNodes.to,
            }
            var connector = surface.getConnectorForNodeWidgetTriple(nodeWidgetTriple);
            if (connector) {
              surface.activateConnector(connector);
            } else {
              surface.createConnector({
                from: fromNodeWidget,
                via:  surface.draggingConnectorNodes.via,
                to:   surface.draggingConnectorNodes.to,
              });
            }
            newLinks.push({
              from: surface.node_id.fromHex(fromNodeWidget.nodeId),
              via:  surface.node_id.fromHex(surface.draggingConnectorNodes.via.nodeId),
              to:   surface.node_id.fromHex(surface.draggingConnectorNodes.to.nodeId)
            });
          });
          
          surface.client.addLinks(newLinks);
        }
        
        draggingConnectors.forEach(function(draggingConnector) {
          Polymer.dom(surface.viewRoot).removeChild(draggingConnector);
        });
        
        surface.finishOperation(self);
      },
      blockEvents: false
    });
  }
  
  NewConnectorDragOperation.prototype.finish = function() {
    
  }
  
  NewConnectorDragOperation.prototype.cancel = function() {
    
  }
  
  return {
    install: function(surface) {
      surface.addEventListener('nodeWidgetAttached', function(event) {
        var nodeWidget = event.detail;
        nodeWidget.addEventListener('rightButtonDragStart', function(event) {
          if (surface.nodeWidgetsTopLevel.has(nodeWidget)) {
            if (!surface.hasOperation()) {
              event.preventDefault();
              surface.beginOperation(NewConnectorDragOperation, event, nodeWidget);
              return false;
            }
          }
        });
      });
    }
  }
  
});
