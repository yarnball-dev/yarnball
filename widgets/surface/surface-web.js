define(['core/node', 'core/transaction', 'core/map', 'core/number'], function(Node, Transaction, Map_, Number) {
  
  function SurfaceWeb(web, base) {
    this._web  = web;
    this._base = base;
  }
  
  var Is         = Node.fromHex('52f9cf0e223d559931856acc98400f21');
  var Widget     = Node.fromHex('31e32c8610ff671d93a4d664d26b21f8');
  var NodeWidget = Node.fromHex('9c9eebc2fa256211d901aef59489923e');
  var Represents = Node.fromHex('262fb8be7b32196d8da05337c2116afa');
  var Connector  = Node.fromHex('b47270cd4c9a491dc1f230ec4a01523e');
  
  var From       = Node.fromHex('96be22fbb74e6934574107e94e5ea694');
  var Via        = Node.fromHex('e999d3deae40585aba30546bdbc77d1c');
  var To         = Node.fromHex('6056f9214eac9efef194de63d978e520');
  
  var Position = Node.fromHex('23852101c8b5798fe8c72e9a668575ef');
  var XAxis    = Node.fromHex('7dba86e48248ff4c115012ff46fe41fe');
  var YAxis    = Node.fromHex('233b57fa8d66698978054e9bd8b116f4');
  
  SurfaceWeb.prototype.getNodeWidgets = function() {
    return this._web.query(null, Is, NodeWidget);
  }
  
  SurfaceWeb.prototype.getConnectors = function() {
    return this._web.query(null, Is, Connector);
  }
  
  SurfaceWeb.prototype.addWidget = function(widget) {
    var transaction = Transaction(this._web);
    
    var WidgetProperties = Map_(transaction, widget.widgetId);
    
    transaction.setLinks([{
      from: widget.widgetId,
      via: Is,
      to: Widget,
    }], []);
    
    if (widget.widgetType === 'yb-node') {
      transaction.setLinks([{
        from: widget.widgetId,
        via: Is,
        to: NodeWidget,
      }], []);
      WidgetProperties.set(Represents, Node.fromHex(widget.nodeId));
    } else if (widget.widgetType === 'yb-connector') {
      transaction.setLinks([{
        from: widget.widgetId,
        via: Is,
        to: Connector,
      }], []);
      WidgetProperties.set(From, widget.fromWidget.widgetId);
      WidgetProperties.set(Via,  widget.viaWidget.widgetId);
      WidgetProperties.set(To,   widget.toWidget.widgetId);
    }
    
    transaction.apply();
  }
  
  SurfaceWeb.prototype.removeWidget = function(widget) {
    var transaction = Transaction(this._web);
    
    var WidgetProperties = Map_(this._web, widget.widgetId);
    
    WidgetProperties.delete(Is, Widget);
    
    if (widget.widgetType === 'yb-node') {
      WidgetProperties.delete(Is, NodeWidget);
      WidgetProperties.delete(Represents);
      
      var WidgetPosition = WidgetProperties.getMap(Position);
      if (WidgetPosition) {
        var WidgetXAxis = WidgetPosition.get(XAxis);
        var WidgetYAxis = WidgetPosition.get(YAxis);
        
        if (WidgetXAxis) {
          Number(this._web, WidgetXAxis).clear();
          WidgetPosition.delete(WidgetXAxis);
        }
        if (WidgetYAxis) {
          Number(this._web, WidgetYAxis).clear();
          WidgetPosition.delete(WidgetYAxis);
        }
        
        WidgetProperties.delete(Position);
      }
      
    } else if (widget.widgetType === 'yb-connector') {
      WidgetProperties.delete(Is, Connector);
      WidgetProperties.delete(From);
      WidgetProperties.delete(Via);
      WidgetProperties.delete(To);
    }
    
    transaction.apply();
  }
  
  SurfaceWeb.prototype.getWidgetPosition = function(Widget) {
    
    var WidgetProperties = Map_(this._web, Widget);
    
    var WidgetPosition = WidgetProperties.getMap(Position);
    if (!WidgetPosition) {
      throw 'Could not get widget position from web, a position is not specified.';
    }
    
    var WidgetXAxis = WidgetPosition.get(XAxis);
    var WidgetYAxis = WidgetPosition.get(YAxis);
    if (!WidgetXAxis || !WidgetYAxis) {
      throw 'Could not get widget position from web, an X or Y axis is not specified.';
    }
    
    return {
      x: Number(this._web, WidgetXAxis).get(),
      y: Number(this._web, WidgetYAxis).get(),
    }
  }
  
  SurfaceWeb.prototype.setWidgetPosition = function(Widget, position) {
    var transaction = Transaction(this._web);
    
    var WidgetProperties = Map_(this._web, Widget);
    
    var WidgetPosition = Map_(this._web, WidgetProperties.getOrMake(Position));
    
    var X = WidgetPosition.hasValidValue(XAxis) ? WidgetPosition.get(XAxis) : null;
    var Y = WidgetPosition.hasValidValue(YAxis) ? WidgetPosition.get(YAxis) : null;
    
    WidgetPosition.set(XAxis, Number(this._web, X).set(position.x));
    WidgetPosition.set(YAxis, Number(this._web, Y).set(position.y));
    
    transaction.apply();
  }
  
  SurfaceWeb.prototype.initializeSurface = function(surface) {
    var self = this;
    
    var NodeWidgets = self.getNodeWidgets();
    NodeWidgets.forEach(function(NodeWidget) {
      var node = self._web.queryOne(NodeWidget, Represents, null);
      if (!node) {
        throw 'Could not get the node being represented by a widget defined in the web.';
      }
      
      var position = self.getWidgetPosition(NodeWidget);
      
      var nodeWidget = surface.createNodeWidget(node, NodeWidget);
      surface.attachWidget(nodeWidget, position);
    });
    
    var Connectors = this.getConnectors();
    Connectors.forEach(function(Connector) {
      
      var connectorProperties = Map_(self._web, Connector);
      
      var from = connectorProperties.get(From);
      var via  = connectorProperties.get(Via);
      var to   = connectorProperties.get(To);
      
      if (!from || !via || !to) {
        throw 'Could not initialize connector from web, from/via/to not specified.';
      }
      
      var fromWidget = surface.getWidgetById(from);
      var viaWidget  = surface.getWidgetById(via);
      var toWidget   = surface.getWidgetById(to);
      
      if (!fromWidget || !viaWidget || !toWidget) {
        throw 'Could not initialize connector from web, from/via/to widgets not found.';
      }
      
      var connector = surface.createConnector(
        {
          from: fromWidget,
          via:  viaWidget,
          to:   toWidget,
        },
        {
          widgetId: Connector,
        }
      );
    });
  }
  
  return function(web, base) {
    return new SurfaceWeb(web, base);
  }
});