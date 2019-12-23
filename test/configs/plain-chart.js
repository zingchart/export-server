module.exports = {
  type: 'mixed',
  globals: {
    fontSize: '18px'
  },
  title: {
    text: 'Internet Explorer Usage vs Murder Rate',
    fontSize: 36,
  },
  legend: {
    marker: {
      size: 12
    },
    item: {
      padding: 10
    },
    marginTop: '80px',
    marginRight: '90px',
    toggleAction: 'hide'
  },
  plotarea: { margin: '65 dynamic' },
  // plot represents general series, or plots, styling
  plot: {
    refAngle: -45,
    valueBox: { visible: false },
    // hoverstate
    tooltip: {
      // % symbol represents a token to insert a value. Full list here:
      // https://www.zingchart.com/docs/tutorials/chart-elements/zingchart-tokens/
      text: 'In %kl there were %data-murders murders<br> and %plot-text of %v%',
      padding: '10px 15px',
      borderRadius: '3px',
      short: true,
    },
    hoverState: { visible: false }
  },
  scaleX: {
    labels: ['2011', '2012', '2013', '2014', '2015', '2016'],
    item: { fontSize: '14px' }
  },
  scaleY: {
    minValue: 14000,
    maxValue: 18000,
    short: true,
    label: {
      text: 'Murders'
    },
    guide: { visible: false },
    maxItems: 5,
    item: { fontSize: '14px' }
  },
  scaleY2: {
    values: [30, 45, 60, 75, 90],
    maxItems: 5,
    format: '%v%',
    label: { text: 'IE Browser Market Share'},
    item: { fontSize: '14px' }
  },
  series: [
    {
      zIndex: 2,
      type: 'line',
      aspect: 'spline',
      text: 'Murders in USA',
      // plot values
      values: [16900, 16700, 16400, 14900, 14700, 14600],
      lineWidth: '6px',
      lineColor: '#4caf50',
      marker: {
        size: '10px',
        borderWidth: '3px',
        borderColor: '#81c784',
        backgroundColor: '#fff'
      },
      legendMarker: {
        type: 'circle',
        showLine: true,
      },
      valueBox: {
        visible: true,
        placement: 'bottom',
        short: true,
        backgroundColor: '#fff',
        offsetX: '-15px',
        offsetY: '8px'
      },
      tooltip: { visible: false }
    },
    {
      type: 'bar',
      text: 'IE 11 Market Share',
      dataMurders: [16900, 16700, 16400, 14900, 14700, 14600],
      values: [78, 72, 68, 65, 60, 46],
      // plot values
      backgroundColor: '#0095d9',
      scales: 'scale-x, scale-y-2',
      valueBox: {
        visible: true,
        placement: 'top-out',
        text: '%v%'
      }
    }
  ]
}