import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

const TIER_CONFIG = {
  tier1: { label: 'Tier 1 — Foundational', color: [0, 245, 160] },
  tier2: { label: 'Tier 2 — Builder', color: [0, 229, 255] },
  tier3: { label: 'Tier 3 — Architect', color: [108, 71, 255] },
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const supabase = await createServerComponentClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 })
    }

    // Fetch project and evaluation
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Security: Only project owner can download certificate
    if (project.user_id !== user.id) {
      return NextResponse.json(
        {
          error: 'Forbidden - Only the project owner can download the certificate',
        },
        { status: 403 }
      )
    }

    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (evalError || !evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single()

    // Generate PDF using PDFKit - A4 Landscape (842pt x 595pt)
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    const tierColor = TIER_CONFIG[evaluation.tier_confirmed as keyof typeof TIER_CONFIG]?.color || [
      108, 71, 255,
    ]
    const tierLabel =
      TIER_CONFIG[evaluation.tier_confirmed as keyof typeof TIER_CONFIG]?.label ||
      evaluation.tier_confirmed

    // Page dimensions
    const pageWidth = 842
    const pageHeight = 595
    const centerX = pageWidth / 2

    // Background - White
    doc
      .rect(0, 0, pageWidth, pageHeight)
      .fillColor([255, 255, 255] as any)
      .fill()

    // Outer border with tier color - rounded corners
    doc
      .roundedRect(40, 40, pageWidth - 80, pageHeight - 80, 10)
      .lineWidth(4)
      .strokeColor(tierColor as any)
      .stroke()

    // Inner decorative border - rounded corners
    doc
      .roundedRect(55, 55, pageWidth - 110, pageHeight - 110, 8)
      .lineWidth(1)
      .strokeColor([224, 224, 224] as any)
      .stroke()

    // Decorative corners
    const cornerSize = 30
    const cornerOffset = 65
    doc.lineWidth(2).strokeColor(tierColor as any)
    // Top-left
    doc
      .moveTo(cornerOffset, cornerOffset)
      .lineTo(cornerOffset + cornerSize, cornerOffset)
      .stroke()
    doc
      .moveTo(cornerOffset, cornerOffset)
      .lineTo(cornerOffset, cornerOffset + cornerSize)
      .stroke()
    // Top-right
    doc
      .moveTo(pageWidth - cornerOffset, cornerOffset)
      .lineTo(pageWidth - cornerOffset - cornerSize, cornerOffset)
      .stroke()
    doc
      .moveTo(pageWidth - cornerOffset, cornerOffset)
      .lineTo(pageWidth - cornerOffset, cornerOffset + cornerSize)
      .stroke()
    // Bottom-left
    doc
      .moveTo(cornerOffset, pageHeight - cornerOffset)
      .lineTo(cornerOffset + cornerSize, pageHeight - cornerOffset)
      .stroke()
    doc
      .moveTo(cornerOffset, pageHeight - cornerOffset)
      .lineTo(cornerOffset, pageHeight - cornerOffset - cornerSize)
      .stroke()
    // Bottom-right
    doc
      .moveTo(pageWidth - cornerOffset, pageHeight - cornerOffset)
      .lineTo(pageWidth - cornerOffset - cornerSize, pageHeight - cornerOffset)
      .stroke()
    doc
      .moveTo(pageWidth - cornerOffset, pageHeight - cornerOffset)
      .lineTo(pageWidth - cornerOffset, pageHeight - cornerOffset - cornerSize)
      .stroke()

    // Brand - VibeCheck
    doc
      .fontSize(36)
      .fillColor(tierColor as any)
      .font('Helvetica-Bold')
      .text('VibeCheck', 0, 100, { align: 'center', width: pageWidth })

    // Certificate title
    doc
      .fontSize(14)
      .fillColor([102, 102, 102] as any)
      .font('Helvetica')
      .text('CERTIFICATE OF ACHIEVEMENT', 0, 145, { align: 'center', width: pageWidth })

    // Divider line
    doc
      .moveTo(centerX - 100, 165)
      .lineTo(centerX + 100, 165)
      .lineWidth(1)
      .strokeColor(tierColor as any)
      .stroke()

    // Recipient section
    doc
      .fontSize(12)
      .fillColor([85, 85, 85] as any)
      .font('Helvetica')
      .text('This is to certify that', 0, 190, { align: 'center', width: pageWidth })

    const displayName = profile?.display_name || profile?.username || 'Developer'
    doc
      .fontSize(26)
      .fillColor([0, 0, 0] as any)
      .font('Helvetica-Bold')
      .text(displayName, 0, 215, { align: 'center', width: pageWidth })

    doc
      .fontSize(12)
      .fillColor([85, 85, 85] as any)
      .font('Helvetica')
      .text('has successfully completed the project', 0, 250, { align: 'center', width: pageWidth })

    // Project Title
    doc
      .fontSize(20)
      .fillColor([0, 0, 0] as any)
      .font('Helvetica-Bold')
      .text(project.title, 100, 275, { align: 'center', width: pageWidth - 200 })

    // Achievement text
    doc
      .fontSize(11)
      .fillColor([85, 85, 85] as any)
      .font('Helvetica')
      .text('and achieved an evaluation score of', 0, 320, { align: 'center', width: pageWidth })

    // Score - Large and prominent
    doc
      .fontSize(68)
      .fillColor(tierColor as any)
      .font('Helvetica-Bold')
      .text(`${evaluation.score_total}`, centerX - 80, 340, { width: 100, align: 'right' })

    doc
      .fontSize(24)
      .fillColor([102, 102, 102] as any)
      .font('Helvetica')
      .text('/ 100', centerX + 20, 370, { width: 100, align: 'left' })

    // Tier Badge with Logo and background tab - centered and aligned
    const tierNumber = evaluation.tier_confirmed.replace('tier', '')
    const badgePath = path.join(process.cwd(), 'public', 'tiers', `tier${tierNumber}.png`)

    doc
      .fontSize(11)
      .fillColor(tierColor as any)
      .font('Helvetica-Bold')

    const tierTextWidth = doc.widthOfString(tierLabel.toUpperCase())
    const badgeStartX = centerX - tierTextWidth / 2 - 8

    // Draw rounded rectangle background for tier badge (tab design)
    const tabPadding = 8
    const tabWidth = tierTextWidth + 32
    const tabHeight = 24
    const tabX = centerX - tabWidth / 2
    const tabY = 417

    // Tab background with tier color
    doc
      .roundedRect(tabX, tabY, tabWidth, tabHeight, 4)
      .fillOpacity(0.1)
      .fillColor(tierColor as any)
      .fill()
      .fillOpacity(1)

    // Tab border
    doc
      .roundedRect(tabX, tabY, tabWidth, tabHeight, 4)
      .lineWidth(1)
      .strokeColor(tierColor as any)
      .stroke()

    // Add tier badge image if it exists - aligned with text baseline
    if (fs.existsSync(badgePath)) {
      doc.image(badgePath, badgeStartX, 423, { width: 12, height: 12 })
      doc.fillColor(tierColor as any).text(tierLabel.toUpperCase(), badgeStartX + 16, 425)
    } else {
      doc
        .fillColor(tierColor as any)
        .text(tierLabel.toUpperCase(), 0, 425, { align: 'center', width: pageWidth })
    }

    // Date
    const dateStr = new Date(evaluation.evaluated_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    doc
      .fontSize(11)
      .fillColor([102, 102, 102] as any)
      .font('Helvetica')
      .text(`Issued on ${dateStr}`, 0, 450, { align: 'center', width: pageWidth })

    // Footer - Verification link (centered and clickable with full project ID)
    const verifyUrl = `https://vibecheck.app/badge/${projectId}`
    const verifyText = `Verify at vibecheck.app/badge/${projectId}`
    doc
      .fontSize(8)
      .fillColor([153, 153, 153] as any)
      .font('Helvetica')
      .text(verifyText, 0, pageHeight - 65, {
        align: 'center',
        width: pageWidth,
        link: verifyUrl,
      })

    doc.end()

    const pdfBuffer = await pdfPromise

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${project.title.replace(/[^a-z0-9]/gi, '_')}_Certificate.pdf"`,
      },
    })
  } catch (error) {
    console.error('Certificate download error:', error)
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 })
  }
}
