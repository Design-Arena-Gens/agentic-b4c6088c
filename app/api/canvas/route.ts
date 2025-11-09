import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { canvasUrl, canvasToken } = await request.json()

    if (!canvasUrl || !canvasToken) {
      return NextResponse.json(
        { error: 'Canvas URL and token are required' },
        { status: 400 }
      )
    }

    // Get user's courses
    const coursesResponse = await fetch(`${canvasUrl}/api/v1/courses?enrollment_state=active`, {
      headers: {
        'Authorization': `Bearer ${canvasToken}`,
      },
    })

    if (!coursesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch courses from Canvas' },
        { status: coursesResponse.status }
      )
    }

    const courses = await coursesResponse.json()

    // Get assignments for each course
    const allAssignments = []
    for (const course of courses.slice(0, 10)) { // Limit to 10 courses to avoid rate limits
      try {
        const assignmentsResponse = await fetch(
          `${canvasUrl}/api/v1/courses/${course.id}/assignments?per_page=50`,
          {
            headers: {
              'Authorization': `Bearer ${canvasToken}`,
            },
          }
        )

        if (assignmentsResponse.ok) {
          const assignments = await assignmentsResponse.json()
          const assignmentsWithCourse = assignments.map((assignment: any) => ({
            ...assignment,
            course_name: course.name,
          }))
          allAssignments.push(...assignmentsWithCourse)
        }
      } catch (error) {
        console.error(`Error fetching assignments for course ${course.id}:`, error)
      }
    }

    return NextResponse.json(allAssignments)
  } catch (error) {
    console.error('Canvas API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
