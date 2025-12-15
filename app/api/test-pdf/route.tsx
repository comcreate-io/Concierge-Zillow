import { NextResponse } from 'next/server'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 20 },
  text: { fontSize: 12 },
})

function TestDoc() {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.title}>Test PDF</Text>
          <Text style={styles.text}>This is a test</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function GET() {
  try {
    const pdfBuffer = await renderToBuffer(<TestDoc />)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test.pdf"',
      },
    })
  } catch (error) {
    console.error('Test PDF error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
