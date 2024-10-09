async function createBufferForSelectedFeature() {
  // URLs for the services
  const pointLayerUrl = 'https://services-ap1.arcgis.com/fmr3nGZRGUm3hVAY/arcgis/rest/services/Development_site_application/FeatureServer/0';
  const polygonLayerUrl = 'https://services-ap1.arcgis.com/fmr3nGZRGUm3hVAY/arcgis/rest/services/Development_site_application/FeatureServer/4';
  const geometryServiceUrl = 'https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer/buffer';

  // Set the spatial reference for New Zealand Transverse Mercator 2000
  const spatialReference = { wkid: 2193 };

  // Get the selected feature from Experience Builder (this would depend on how you are selecting it)
  // For this example, I'm assuming you have the OBJECTID of the selected feature
  const selectedFeatureId = 1; // Replace with the actual OBJECTID of the selected feature

  // Step 1: Query the point feature for its geometry and TPR value
  const queryUrl = `${pointLayerUrl}/query?where=OBJECTID=${selectedFeatureId}&outFields=*&returnGeometry=true&f=json`;
  const pointResponse = await fetch(queryUrl);
  const pointData = await pointResponse.json();

  if (pointData.features.length === 0) {
    alert("No features found with the given OBJECTID.");
    return;
  }

  const pointGeometry = pointData.features[0].geometry;
  const tpr = pointData.features[0].attributes.tpr;

  // Step 2: Create the buffer using the Geometry Service
  const bufferParams = {
    geometries: {
      geometryType: 'esriGeometryPoint',
      geometries: [pointGeometry]
    },
    distances: [tpr],
    unit: 9001, // 9001 corresponds to meters
    geodesic: true,
    bufferSpatialReference: spatialReference,
    outSpatialReference: spatialReference,
    f: 'json'
  };

  const bufferResponse = await fetch(geometryServiceUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bufferParams)
  });

  const bufferData = await bufferResponse.json();
  const bufferGeometry = bufferData.geometries[0];

  // Step 3: Add the buffer polygon to the polygon feature layer
  const addPolygonUrl = `${polygonLayerUrl}/applyEdits`;

  const addPolygonParams = {
    f: 'json',
    adds: [{
      geometry: bufferGeometry,
      attributes: {}
    }]
  };

  const addPolygonResponse = await fetch(addPolygonUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(addPolygonParams)
  });

  const result = await addPolygonResponse.json();
  if (result.addResults && result.addResults[0].success) {
    alert("Buffer created and added to the polygon layer successfully!");
  } else {
    alert("Failed to create buffer.");
  }
}
