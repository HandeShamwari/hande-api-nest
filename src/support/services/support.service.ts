import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  CreateSupportTicketDto,
  UpdateSupportTicketDto,
  TicketStatus,
  TicketPriority,
} from '../dto/support.dto';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create support ticket (driver)
   */
  async createTicket(userId: string, dto: CreateSupportTicketDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const ticket = await this.prisma.driverSupportTicket.create({
      data: {
        driverId: driver.id,
        subject: dto.subject,
        description: dto.description,
        status: TicketStatus.OPEN,
        priority: dto.priority || TicketPriority.MEDIUM,
      },
    });

    this.logger.log(`Support ticket created: ${ticket.id} by driver ${driver.id}`);

    return {
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
    };
  }

  /**
   * Get driver's support tickets
   */
  async getMyTickets(userId: string, status?: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const tickets = await this.prisma.driverSupportTicket.findMany({
      where: {
        driverId: driver.id,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt,
      resolvedAt: t.resolvedAt,
    }));
  }

  /**
   * Get ticket details
   */
  async getTicket(userId: string, ticketId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const ticket = await this.prisma.driverSupportTicket.findFirst({
      where: {
        id: ticketId,
        driverId: driver.id,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return {
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      resolvedAt: ticket.resolvedAt,
    };
  }

  /**
   * Update ticket (add more details)
   */
  async updateTicket(userId: string, ticketId: string, dto: UpdateSupportTicketDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const ticket = await this.prisma.driverSupportTicket.findFirst({
      where: {
        id: ticketId,
        driverId: driver.id,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.RESOLVED) {
      throw new ForbiddenException('Cannot update a closed or resolved ticket');
    }

    const updated = await this.prisma.driverSupportTicket.update({
      where: { id: ticketId },
      data: {
        description: dto.description
          ? `${ticket.description}\n\n--- Update ---\n${dto.description}`
          : ticket.description,
      },
    });

    return {
      id: updated.id,
      subject: updated.subject,
      description: updated.description,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Close ticket (user resolved issue)
   */
  async closeTicket(userId: string, ticketId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const ticket = await this.prisma.driverSupportTicket.findFirst({
      where: {
        id: ticketId,
        driverId: driver.id,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    await this.prisma.driverSupportTicket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.CLOSED,
        resolvedAt: new Date(),
      },
    });

    return { success: true, message: 'Ticket closed' };
  }

  /**
   * Get ticket count by status
   */
  async getTicketCounts(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const [open, inProgress, resolved, closed] = await Promise.all([
      this.prisma.driverSupportTicket.count({
        where: { driverId: driver.id, status: TicketStatus.OPEN },
      }),
      this.prisma.driverSupportTicket.count({
        where: { driverId: driver.id, status: TicketStatus.IN_PROGRESS },
      }),
      this.prisma.driverSupportTicket.count({
        where: { driverId: driver.id, status: TicketStatus.RESOLVED },
      }),
      this.prisma.driverSupportTicket.count({
        where: { driverId: driver.id, status: TicketStatus.CLOSED },
      }),
    ]);

    return {
      open,
      inProgress,
      resolved,
      closed,
      total: open + inProgress + resolved + closed,
    };
  }
}
